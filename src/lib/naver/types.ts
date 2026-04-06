// Naver Place review crawling types

export interface NaverReview {
  /** Unique review identifier from Naver */
  externalId: string;
  /** Reviewer display name */
  reviewerName: string;
  /** Star rating (1-5) */
  rating: number;
  /** Review text content */
  content: string;
  /** Review date as ISO string */
  reviewDate: string;
  /** Number of photos attached */
  photoCount: number;
}

export interface CrawlResult {
  reviews: NaverReview[];
  totalCount: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  newReviews: number;
  totalReviews: number;
  error?: string;
}

/**
 * Extract placeId from various Naver Place URL formats.
 * Supports:
 *   - https://m.place.naver.com/restaurant/1234567890
 *   - https://place.naver.com/restaurant/1234567890
 *   - https://m.place.naver.com/restaurant/1234567890/review/visitor
 */
export function extractPlaceId(url: string): string | null {
  const match = url.match(/place\.naver\.com\/restaurant\/(\d+)/);
  return match?.[1] ?? null;
}
