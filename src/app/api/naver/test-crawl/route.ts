// GET /api/naver/test-crawl?placeId=1428471321
// Test endpoint for Naver Place crawling verification
// TODO: Remove before production launch

import { NextResponse } from "next/server";
import { crawlNaverReviews } from "@/lib/naver/crawler";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const placeId = url.searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "placeId query parameter required" },
      { status: 400 }
    );
  }

  const result = await crawlNaverReviews(placeId);

  return NextResponse.json({
    placeId,
    totalCount: result.totalCount,
    error: result.error ?? null,
    reviews: result.reviews.map((r) => ({
      name: r.reviewerName,
      rating: r.rating,
      content: r.content?.substring(0, 100),
      date: r.reviewDate,
      photos: r.photoCount,
    })),
  });
}
