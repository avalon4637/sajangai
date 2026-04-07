// Supabase Edge Function: Naver Place review crawler
// Deno runtime — calls Naver's GraphQL API from edge infrastructure
// Invoked via: supabase functions invoke naver-crawl --body '{"placeId":"1428471321"}'
// Or via HTTP: POST /functions/v1/naver-crawl

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mobile User-Agent rotation
const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.35 Mobile/15E148 Safari/604.1",
];

interface NaverReview {
  externalId: string;
  reviewerName: string;
  rating: number;
  content: string;
  reviewDate: string;
  photoCount: number;
}

interface CrawlResult {
  placeId: string;
  storeName: string | null;
  reviews: NaverReview[];
  totalCount: number;
  error?: string;
}

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function crawlNaverReviews(placeId: string): Promise<CrawlResult> {
  const userAgent = getRandomUserAgent();

  // Step 1: Get store info
  let storeName: string | null = null;
  try {
    const infoRes = await fetch("https://api.place.naver.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        "Referer": `https://m.place.naver.com/restaurant/${placeId}/home`,
        "Origin": "https://m.place.naver.com",
      },
      body: JSON.stringify([{
        operationName: "getRestaurant",
        variables: { input: { id: placeId } },
        query: `query getRestaurant($input: RestaurantInput) {
          restaurant(input: $input) { name category visitorReviewScore visitorReviewCount }
        }`,
      }]),
    });
    const infoData = await infoRes.json();
    storeName = infoData?.[0]?.data?.restaurant?.name ?? null;
  } catch {
    // Store name fetch failed — continue without it
  }

  // Step 2: Get reviews via GraphQL
  const reviewRes = await fetch("https://api.place.naver.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
      "Referer": `https://m.place.naver.com/restaurant/${placeId}/review/visitor`,
      "Origin": "https://m.place.naver.com",
    },
    body: JSON.stringify([{
      operationName: "getVisitorReviews",
      variables: {
        input: {
          businessId: placeId,
          businessType: "restaurant",
          page: 1,
          display: 20,
          isPhotoUsed: false,
          sort: "recent",
        },
      },
      query: `query getVisitorReviews($input: VisitorReviewsInput) {
        visitorReviews(input: $input) {
          items {
            id
            rating
            author { nickname }
            body
            created
            media { type }
          }
          total
        }
      }`,
    }]),
  });

  if (!reviewRes.ok) {
    return {
      placeId,
      storeName,
      reviews: [],
      totalCount: 0,
      error: `Naver API returned ${reviewRes.status}`,
    };
  }

  const data = await reviewRes.json();
  const reviewData = data?.[0]?.data?.visitorReviews;

  if (!reviewData?.items) {
    return {
      placeId,
      storeName,
      reviews: [],
      totalCount: reviewData?.total ?? 0,
      error: reviewData ? undefined : "No review data in response",
    };
  }

  const reviews: NaverReview[] = reviewData.items.map(
    (item: {
      id: string;
      rating: number;
      author?: { nickname?: string };
      body?: string;
      created: string;
      media?: { type: string }[];
    }) => ({
      externalId: String(item.id),
      reviewerName: item.author?.nickname ?? "Anonymous",
      rating: Math.min(5, Math.max(1, item.rating ?? 5)),
      content: item.body ?? "",
      reviewDate: item.created,
      photoCount: item.media?.filter((m: { type: string }) => m.type === "photo").length ?? 0,
    })
  );

  return {
    placeId,
    storeName,
    reviews,
    totalCount: reviewData.total ?? reviews.length,
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { placeId, businessId, saveToDb } = await req.json();

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: "placeId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Crawl reviews
    const result = await crawlNaverReviews(placeId);

    // Optionally save to database
    if (saveToDb && businessId && result.reviews.length > 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Upsert reviews (skip duplicates by external_review_id)
      let newCount = 0;
      for (const review of result.reviews) {
        const { error } = await supabase
          .from("delivery_reviews")
          .upsert(
            {
              business_id: businessId,
              platform: "naver",
              external_review_id: review.externalId,
              reviewer_name: review.reviewerName,
              rating: review.rating,
              content: review.content,
              review_date: review.reviewDate,
              reply_status: "pending",
            },
            { onConflict: "business_id,external_review_id" }
          );

        if (!error) newCount++;
      }

      // Update last sync timestamp
      await supabase
        .from("businesses")
        .update({ naver_last_synced_at: new Date().toISOString() })
        .eq("id", businessId);

      return new Response(
        JSON.stringify({
          ...result,
          saved: true,
          newReviews: newCount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
