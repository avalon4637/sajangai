// Naver Place review crawler
// Crawls public reviews from m.place.naver.com using fetch + cheerio
// Falls back to Naver's internal API if HTML parsing fails

import * as cheerio from "cheerio";
import type { NaverReview, CrawlResult } from "./types";

// Mobile User-Agent rotation for natural-looking requests
const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.35 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.50 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Random delay between min and max milliseconds.
 * Prevents rate-limiting by adding human-like delays.
 */
function delay(minMs: number = 3000, maxMs: number = 10000): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic and exponential backoff.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 3s, 6s, 12s...
        await delay(3000 * Math.pow(2, attempt), 5000 * Math.pow(2, attempt));
      }

      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        return response;
      }

      // Don't retry 4xx client errors (except 429 Too Many Requests)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("Fetch failed after retries");
}

/**
 * Primary approach: Use Naver's internal API to fetch reviews as JSON.
 * The mobile Naver Place page loads reviews via this endpoint.
 */
async function crawlViaApi(placeId: string): Promise<NaverReview[]> {
  const url = `https://api.place.naver.com/graphql`;
  const userAgent = getRandomUserAgent();

  const body = JSON.stringify([
    {
      operationName: "getVisitorReviews",
      variables: {
        input: {
          businessId: placeId,
          businessType: "restaurant",
          item: "0",
          bookingBusinessId: null,
          page: 1,
          display: 50,
          isPhotoUsed: false,
          theme: "0",
          sort: "recent",
        },
      },
      query: `query getVisitorReviews($input: VisitorReviewsInput) {
        visitorReviews(input: $input) {
          items {
            id
            rating
            author {
              nickname
            }
            body
            created
            media {
              type
            }
          }
          total
        }
      }`,
    },
  ]);

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
      Referer: `https://m.place.naver.com/restaurant/${placeId}/review/visitor`,
      Origin: "https://m.place.naver.com",
    },
    body,
  });

  const data = await response.json();

  // Response is an array; first element contains our query result
  const reviewData = data?.[0]?.data?.visitorReviews;
  if (!reviewData?.items) {
    return [];
  }

  return reviewData.items.map(
    (item: {
      id: string;
      rating: number;
      author?: { nickname?: string };
      body?: string;
      created: string;
      media?: { type: string }[];
    }): NaverReview => ({
      externalId: String(item.id),
      reviewerName: item.author?.nickname ?? "Anonymous",
      rating: Math.min(5, Math.max(1, item.rating ?? 5)),
      content: item.body ?? "",
      reviewDate: item.created,
      photoCount: item.media?.filter((m) => m.type === "photo").length ?? 0,
    })
  );
}

/**
 * Fallback approach: Crawl the mobile HTML page and parse with cheerio.
 * Used when the API endpoint is unavailable or returns unexpected format.
 */
async function crawlViaHtml(placeId: string): Promise<NaverReview[]> {
  const url = `https://m.place.naver.com/restaurant/${placeId}/review/visitor`;
  const userAgent = getRandomUserAgent();

  const response = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });

  const html = await response.text();
  const $ = cheerio.load(html);
  const reviews: NaverReview[] = [];

  // Try to extract __NEXT_DATA__ JSON (Next.js SSR data)
  const nextDataScript = $('script#__NEXT_DATA__').html();
  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript);
      // Navigate the Next.js page props for review data
      const pageProps = nextData?.props?.pageProps;
      const reviewItems =
        pageProps?.initialState?.review?.list ??
        pageProps?.review?.list ??
        [];

      for (const item of reviewItems) {
        reviews.push({
          externalId: String(item.id ?? item.reviewId ?? `html-${reviews.length}`),
          reviewerName: item.author?.nickname ?? item.authorNickname ?? "Anonymous",
          rating: Math.min(5, Math.max(1, item.rating ?? 5)),
          content: item.body ?? item.content ?? "",
          reviewDate: item.created ?? item.createdDate ?? new Date().toISOString(),
          photoCount: item.media?.length ?? item.photoCount ?? 0,
        });
      }

      if (reviews.length > 0) return reviews;
    } catch {
      // JSON parse failed, continue to DOM parsing
    }
  }

  // DOM-based parsing as last resort
  // Naver frequently changes class names, so we use multiple selectors
  const reviewSelectors = [
    '[class*="review_item"]',
    '[class*="ReviewItem"]',
    '[class*="visitor_review"]',
    'li[class*="review"]',
  ];

  for (const selector of reviewSelectors) {
    $(selector).each((idx, el) => {
      const $el = $(el);
      const reviewerName =
        $el.find('[class*="author"], [class*="nickname"], [class*="user_name"]').first().text().trim() ||
        "Anonymous";
      const content =
        $el.find('[class*="review_content"], [class*="body"], [class*="text"]').first().text().trim() ||
        "";
      const ratingText = $el.find('[class*="rating"], [class*="star"]').first().text().trim();
      const rating = parseInt(ratingText, 10) || 5;
      const dateText = $el.find('[class*="date"], [class*="time"], time').first().text().trim();
      const photoCount = $el.find('[class*="photo"], img[class*="thumb"]').length;

      if (content) {
        reviews.push({
          externalId: `html-${placeId}-${idx}`,
          reviewerName,
          rating: Math.min(5, Math.max(1, rating)),
          content,
          reviewDate: dateText || new Date().toISOString(),
          photoCount,
        });
      }
    });

    if (reviews.length > 0) break;
  }

  return reviews;
}

/**
 * Crawl Naver Place reviews for a given placeId.
 * Tries the internal API first, falls back to HTML parsing.
 *
 * @param placeId - Naver Place restaurant ID (numeric string)
 * @returns CrawlResult with reviews array and total count
 */
export async function crawlNaverReviews(placeId: string): Promise<CrawlResult> {
  try {
    // Add initial delay to be respectful
    await delay(1000, 3000);

    // Try API approach first (more reliable)
    let reviews = await crawlViaApi(placeId);

    // Fallback to HTML parsing if API returns nothing
    if (reviews.length === 0) {
      await delay(2000, 5000);
      reviews = await crawlViaHtml(placeId);
    }

    return {
      reviews,
      totalCount: reviews.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[NaverCrawler] Failed to crawl placeId=${placeId}:`, message);

    return {
      reviews: [],
      totalCount: 0,
      error: message,
    };
  }
}
