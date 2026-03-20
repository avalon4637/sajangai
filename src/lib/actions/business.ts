"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTrialSubscription } from "@/lib/billing/subscription";
import { getRegionFromBusinessNumber, mapNtsSectorToIndustryCode } from "@/lib/data/tax-office-regions";

interface RegisterBusinessData {
  name: string;
  business_type?: string;
  address?: string;
  // Data farm fields - auto-populated from NTS verification
  industry_code?: string;
  region_code?: string;
  business_number?: string;
  nts_sector?: string;
  nts_type?: string;
}

export async function registerBusiness(data: RegisterBusinessData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const { data: businessData, error } = await supabase
    .from("businesses")
    .insert({
      user_id: user.id,
      name: data.name,
      business_type: data.business_type || null,
      address: data.address || null,
      // Data farm columns (nullable - present only after NTS verification)
      industry_code: data.industry_code || null,
      region_code: data.region_code || null,
      business_number: data.business_number || null,
      nts_sector: data.nts_sector || null,
      nts_type: data.nts_type || null,
    })
    .select("id")
    .single();

  if (error || !businessData) {
    return { success: false, error: "사업장 등록에 실패했습니다." };
  }

  // Auto-create 7-day trial subscription for new businesses
  await createTrialSubscription(businessData.id);

  revalidatePath("/dashboard");
  return { success: true };
}

// NTS API response structure for business number validation
interface NtsValidateItem {
  b_no: string;
  valid: "01" | "02" | string;
  valid_msg: string;
  request_param?: {
    b_no: string;
    start_dt?: string;
    p_nm?: string;
    p_nm2?: string;
    b_nm?: string;
    corp_no?: string;
    b_sector?: string;
    b_type?: string;
  };
  status?: {
    b_no: string;
    b_stt: string;
    b_stt_cd: string;
    tax_type: string;
    tax_type_cd: string;
    end_dt: string;
    utcc_yn: string;
    tax_type_change_dt: string;
    invoice_apply_dt: string;
    rbf_tax_type: string;
    rbf_tax_type_cd: string;
  };
}

interface NtsValidateResponse {
  status_code: string;
  match_cnt: number;
  request_cnt: number;
  data: NtsValidateItem[];
}

export interface VerifyBusinessResult {
  success: boolean;
  isActive?: boolean;
  businessNumber?: string;
  validMsg?: string;
  // Data farm: NTS sector/type and derived codes
  bSector?: string;
  bType?: string;
  industryCode?: string;
  regionCode?: string;
  regionNameKo?: string;
  error?: string;
}

/**
 * Verifies a Korean business registration number using the NTS (국세청) API.
 * Requires NTS_API_KEY environment variable set on the server.
 * Also derives industry_code and region_code from the NTS response for data farm use.
 */
export async function verifyBusinessNumber(
  businessNumber: string
): Promise<VerifyBusinessResult> {
  // Strip formatting characters (hyphens, spaces) to get raw 10-digit number
  const rawNumber = businessNumber.replace(/[-\s]/g, "");

  if (!/^\d{10}$/.test(rawNumber)) {
    return { success: false, error: "사업자등록번호는 10자리 숫자여야 합니다." };
  }

  const apiKey = process.env.NTS_API_KEY;
  if (!apiKey) {
    console.error("NTS_API_KEY is not configured");
    return { success: false, error: "서버 설정 오류입니다. 잠시 후 다시 시도해주세요." };
  }

  try {
    const response = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ b_no: [rawNumber] }),
      }
    );

    if (!response.ok) {
      console.error("NTS API error:", response.status, response.statusText);
      return { success: false, error: "국세청 API 호출에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }

    const result: NtsValidateResponse = await response.json();

    if (!result.data || result.data.length === 0) {
      return { success: false, error: "사업자등록번호 조회 결과가 없습니다." };
    }

    const item = result.data[0];

    // valid "01" means active (계속사업자), "02" means closed (휴폐업자)
    const isActive = item.valid === "01";

    // Extract NTS sector/type from request_param (returned by NTS status check endpoint)
    const bSector = item.request_param?.b_sector;
    const bType = item.request_param?.b_type;

    // Derive data farm codes from NTS data
    const industryCode = mapNtsSectorToIndustryCode(bSector, bType);
    const regionInfo = getRegionFromBusinessNumber(rawNumber);

    return {
      success: true,
      isActive,
      businessNumber: item.b_no,
      validMsg: item.valid_msg,
      bSector,
      bType,
      industryCode,
      regionCode: regionInfo?.code,
      regionNameKo: regionInfo?.nameKo,
    };
  } catch (err) {
    console.error("verifyBusinessNumber error:", err);
    return { success: false, error: "사업자번호 인증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
