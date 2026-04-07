// Deeplink URL builder for delivery platform review pages
// Used by Dapjangi mobile inline actions to open platform-specific review management

export function getReviewDeeplink(
  platform: string,
  reviewId?: string | null
): string {
  switch (platform.toLowerCase()) {
    case "baemin":
      return "https://ceo.baemin.com/reviews";
    case "coupangeats":
      return "https://store.coupangeats.com/merchant/reviews";
    case "yogiyo":
      return "https://ceo.yogiyo.co.kr/reviews";
    case "naver":
      return "https://smartplace.naver.com/reviews";
    default:
      return "#";
  }
}
