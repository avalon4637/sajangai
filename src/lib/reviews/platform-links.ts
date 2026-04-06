// Platform deep link mapping for delivery review management portals
// Returns the owner/admin portal URL where business owners write replies

export type ReviewPlatform =
  | "baemin"
  | "coupangeats"
  | "yogiyo"
  | "naver_place";

const PLATFORM_LINKS: Record<ReviewPlatform, string> = {
  baemin: "https://ceo.baemin.com/reviews",
  coupangeats: "https://store.coupangeats.com/reviews",
  yogiyo: "https://ceo.yogiyo.co.kr/reviews",
  naver_place: "https://smartplace.naver.com/",
};

const PLATFORM_LABELS: Record<ReviewPlatform, string> = {
  baemin: "배민",
  coupangeats: "쿠팡이츠",
  yogiyo: "요기요",
  naver_place: "네이버 플레이스",
};

/**
 * Get the review management portal URL for a given platform.
 *
 * @param platform - Platform identifier (baemin, coupangeats, yogiyo, naver_place)
 * @returns URL string for the platform's owner review management page
 */
export function getReplyPageUrl(platform: string): string {
  return (
    PLATFORM_LINKS[platform as ReviewPlatform] ??
    "https://ceo.baemin.com/reviews"
  );
}

/**
 * Get Korean label for the platform.
 *
 * @param platform - Platform identifier
 * @returns Korean display name
 */
export function getPlatformLabel(platform: string): string {
  return PLATFORM_LABELS[platform as ReviewPlatform] ?? platform;
}

/**
 * Check if platform is a known delivery/review platform.
 */
export function isKnownPlatform(platform: string): platform is ReviewPlatform {
  return platform in PLATFORM_LINKS;
}
