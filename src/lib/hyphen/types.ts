// Hyphen API type definitions
// Based on actual API specs from https://hyphen.im/product-api/view?seq=14, seq=17

// ---------------------------------------------------------------------------
// Client config
// ---------------------------------------------------------------------------

export interface HyphenConfig {
  userId: string;
  hkey: string;
  baseUrl: string;
  timeout: number;
  retries: number;
}

// ---------------------------------------------------------------------------
// Common response wrapper (all Hyphen APIs share this)
// ---------------------------------------------------------------------------

export interface HyphenCommon {
  userTrNo: string;
  hyphenTrNo: string;
  errYn: string; // "Y" | "N"
  errCd: string;
  errMsg: string;
}

export interface HyphenApiResponse<T> {
  common: HyphenCommon;
  data: T;
}

export class HyphenApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "HyphenApiError";
  }
}

// ---------------------------------------------------------------------------
// Delivery app API types (seq=17)
// ---------------------------------------------------------------------------

export type DeliveryPlatform = "baemin" | "coupangeats" | "yogiyo";

/** Endpoint mapping per platform */
export const DELIVERY_ENDPOINTS: Record<
  DeliveryPlatform,
  { review: string; order: string }
> = {
  coupangeats: { review: "/in0024000800", order: "/in0024000086" },
  yogiyo: { review: "/in0023000085", order: "/in0023000077" },
  baemin: { review: "/in0022000083", order: "/in0022000066" },
};

/** Request body for delivery APIs */
export interface DeliveryRequestBody {
  userId: string;
  userPw: string;
  dateFrom: string; // yyyymmdd
  dateTo: string; // yyyymmdd
  storeId?: string;
}

/** Review item from delivery API response */
export interface HyphenReviewItem {
  orderReviewId: string;
  abbrOrderId: string;
  reviewId: string;
  reviewDt: string;
  reviewTm: string;
  allStar: string;
  jumun: string;
  comment: string;
  orderType: string;
  ownerReplyId: string;
  ownerReply: string;
  ownerReplyDt: string;
  ownerReplyTm: string;
  reviewImgList: Array<{ reviewImg: string }>;
}

/** Store with reviews from delivery API */
export interface HyphenStoreReview {
  storeName: string;
  storeId: string;
  allStar: string;
  reviewCnt: string;
  commentCnt: string;
  reviewList: HyphenReviewItem[];
}

/** Response data for delivery review API */
export interface HyphenDeliveryReviewData {
  storeList: HyphenStoreReview[];
}

/** Order detail item */
export interface HyphenOrderDetail {
  unitPrice: string;
  quantity: string;
  salePrice: string;
  name: string;
  options: Array<{
    optionPrice: string;
    optionName: string;
    optionQuantity: string;
  }>;
}

/** Order item from delivery API */
export interface HyphenOrderItem {
  storeId: string;
  adFee: string;
  orderDiv: string;
  orderDt: string;
  orderTm: string;
  settleDt: string;
  orderNo: string;
  orderName: string;
  deliveryType: string;
  totalAmt: string;
  discntAmt: string;
  orderFee: string;
  cardFee: string;
  deliveryAmt: string;
  addTax: string;
  settleAmt: string;
  detailList: HyphenOrderDetail[];
}

/** Response data for delivery order API */
export interface HyphenDeliveryOrderData {
  storeList: HyphenStoreReview[];
  totOrderCnt: string;
  startDate: string;
  endDate: string;
  touchSucCnt: string;
  touchCanCnt: string;
  callSucCnt: string;
  callCanCnt: string;
  touchOrderAmt: string;
  onlineOrderAmt: string;
  offlineOrderAmt: string;
  touchOrderList: HyphenOrderItem[];
}

// ---------------------------------------------------------------------------
// Card company API types (seq=14)
// ---------------------------------------------------------------------------

export const CARD_ENDPOINTS = {
  deposit: "/in0007000769", // Card deposit (settlement) inquiry
  purchase: "/in0007000768", // Card purchase inquiry
  approval: "/in0007000033", // Card approval inquiry
  merchantInfo: "/in0007000031", // Merchant info inquiry
} as const;

export const CARD_COMPANY_CODES: Record<string, string> = {
  "001": "신한카드",
  "002": "현대카드",
  "003": "삼성카드",
  "004": "KB국민카드",
  "005": "롯데카드",
  "006": "하나카드",
  "007": "우리카드",
  "008": "농협카드",
  "010": "BC카드",
};

/** Request body for card approval API */
export interface CardApprovalRequestBody {
  cardCd: string;
  loginMethod: string; // "ID"
  userId: string;
  userPw: string;
  sdate: string; // yyyymmdd
  edate: string; // yyyymmdd
  useArea?: string; // "N" | "D" | "G" (Shinhan only)
  memberYn?: string; // "Y" | "N"
  memberNo?: string;
}

/** Request body for card deposit/purchase API */
export interface CardDepositRequestBody {
  cardCd: string;
  loginMethod: string;
  userId: string;
  userPw: string;
  sdate: string;
  edate: string;
  searchType?: string; // "1": purchase date, "2": approval date
  memberYn?: string;
  memberNo?: string;
}

/** Card approval record from API */
export interface HyphenCardApprovalItem {
  appDt: string;
  appTm: string;
  appNo: string;
  appAmt: string;
  useCard: string;
  useDiv: string;
  instMon: string;
  cardType: string;
  appMethod: string;
  appSt: string;
  pchDt: string;
  appCancel: string;
  pchCancel: string;
  fee: string;
  payDt: string;
  payAmt: string;
  comDiv: string;
  svcFee: string;
  exYn: string;
}

/** Card deposit/settlement record from API */
export interface HyphenCardDepositItem {
  payDt: string;
  paySchDt: string;
  recDt: string;
  totalCnt: string;
  payCnt: string;
  canCnt: string;
  curCd: string;
  useDiv: string;
  useCard: string;
  salesAmt: string;
  salesSchAmt: string;
  payAmt: string;
  paySchAmt: string;
  adjAmt: string;
  canAmt: string;
  deductAmt: string;
  feeSum: string;
  feeMem: string;
  vatAmt: string;
}

/** Response data for card approval API */
export interface HyphenCardApprovalData {
  list: HyphenCardApprovalItem[];
  step_data?: string;
}

/** Response data for card deposit API */
export interface HyphenCardDepositData {
  list: HyphenCardDepositItem[];
  memberNo?: string;
  memberNm?: string;
}

// ---------------------------------------------------------------------------
// Connection types (shared with database)
// ---------------------------------------------------------------------------

export type ConnectionStatus = "active" | "inactive" | "error" | "expired";
export type SyncStatus = "pending" | "running" | "completed" | "failed";
export type ConnectionType = "card_sales" | "delivery";

export interface ApiConnection {
  id: string;
  business_id: string;
  provider: string;
  connection_type: ConnectionType;
  status: ConnectionStatus;
  config: Record<string, unknown>;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}
