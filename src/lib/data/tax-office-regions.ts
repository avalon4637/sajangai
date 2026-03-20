// Mapping from Korean business registration number prefix (first 3 digits)
// to tax office region information.
// Used to auto-detect region_code when a business number is verified.

export interface TaxOfficeRegion {
  code: string; // region_code in regions table
  nameKo: string; // e.g. "서울 종로구"
  sido: string; // e.g. "서울특별시"
  sigungu: string; // e.g. "종로구"
}

const TAX_OFFICE_REGIONS: Record<string, TaxOfficeRegion> = {
  // Seoul
  "101": { code: "seoul_jongno", nameKo: "서울 종로구", sido: "서울특별시", sigungu: "종로구" },
  "102": { code: "seoul_jung", nameKo: "서울 중구", sido: "서울특별시", sigungu: "중구" },
  "103": { code: "seoul_yongsan", nameKo: "서울 용산구", sido: "서울특별시", sigungu: "용산구" },
  "104": { code: "seoul_seongdong", nameKo: "서울 성동구", sido: "서울특별시", sigungu: "성동구" },
  "105": { code: "seoul_dongdaemun", nameKo: "서울 동대문구", sido: "서울특별시", sigungu: "동대문구" },
  "106": { code: "seoul_jungnang", nameKo: "서울 중랑구", sido: "서울특별시", sigungu: "중랑구" },
  "107": { code: "seoul_seongbuk", nameKo: "서울 성북구", sido: "서울특별시", sigungu: "성북구" },
  "108": { code: "seoul_gangbuk", nameKo: "서울 강북구", sido: "서울특별시", sigungu: "강북구" },
  "109": { code: "seoul_dobong", nameKo: "서울 도봉구", sido: "서울특별시", sigungu: "도봉구" },
  "110": { code: "seoul_nowon", nameKo: "서울 노원구", sido: "서울특별시", sigungu: "노원구" },
  "111": { code: "seoul_eunpyeong", nameKo: "서울 은평구", sido: "서울특별시", sigungu: "은평구" },
  "112": { code: "seoul_seodaemun", nameKo: "서울 서대문구", sido: "서울특별시", sigungu: "서대문구" },
  "113": { code: "seoul_mapo", nameKo: "서울 마포구", sido: "서울특별시", sigungu: "마포구" },
  "114": { code: "seoul_yeongdeungpo", nameKo: "서울 영등포구", sido: "서울특별시", sigungu: "영등포구" },
  "115": { code: "seoul_dongjak", nameKo: "서울 동작구", sido: "서울특별시", sigungu: "동작구" },
  "116": { code: "seoul_gwanak", nameKo: "서울 관악구", sido: "서울특별시", sigungu: "관악구" },
  "117": { code: "seoul_seocho", nameKo: "서울 서초구", sido: "서울특별시", sigungu: "서초구" },
  "118": { code: "seoul_gangnam", nameKo: "서울 강남구", sido: "서울특별시", sigungu: "강남구" },
  "119": { code: "seoul_songpa", nameKo: "서울 송파구", sido: "서울특별시", sigungu: "송파구" },
  "120": { code: "seoul_gangdong", nameKo: "서울 강동구", sido: "서울특별시", sigungu: "강동구" },
  "121": { code: "seoul_geumcheon", nameKo: "서울 금천구", sido: "서울특별시", sigungu: "금천구" },
  "122": { code: "seoul_guro", nameKo: "서울 구로구", sido: "서울특별시", sigungu: "구로구" },
  "124": { code: "seoul_yangcheon", nameKo: "서울 양천구", sido: "서울특별시", sigungu: "양천구" },
  "125": { code: "seoul_gangseo", nameKo: "서울 강서구", sido: "서울특별시", sigungu: "강서구" },
  // Busan
  "201": { code: "busan_jung", nameKo: "부산 중구", sido: "부산광역시", sigungu: "중구" },
  "202": { code: "busan_seo", nameKo: "부산 서구", sido: "부산광역시", sigungu: "서구" },
  "203": { code: "busan_dong", nameKo: "부산 동구", sido: "부산광역시", sigungu: "동구" },
  "204": { code: "busan_yeongdo", nameKo: "부산 영도구", sido: "부산광역시", sigungu: "영도구" },
  "205": { code: "busan_busanjin", nameKo: "부산 부산진구", sido: "부산광역시", sigungu: "부산진구" },
  "206": { code: "busan_dongnae", nameKo: "부산 동래구", sido: "부산광역시", sigungu: "동래구" },
  "207": { code: "busan_nam", nameKo: "부산 남구", sido: "부산광역시", sigungu: "남구" },
  "208": { code: "busan_buk", nameKo: "부산 북구", sido: "부산광역시", sigungu: "북구" },
  "209": { code: "busan_haeundae", nameKo: "부산 해운대구", sido: "부산광역시", sigungu: "해운대구" },
  "210": { code: "busan_saha", nameKo: "부산 사하구", sido: "부산광역시", sigungu: "사하구" },
  "211": { code: "busan_geumjeong", nameKo: "부산 금정구", sido: "부산광역시", sigungu: "금정구" },
  "212": { code: "busan_gangseo", nameKo: "부산 강서구", sido: "부산광역시", sigungu: "강서구" },
  "213": { code: "busan_yeonje", nameKo: "부산 연제구", sido: "부산광역시", sigungu: "연제구" },
  "214": { code: "busan_suyeong", nameKo: "부산 수영구", sido: "부산광역시", sigungu: "수영구" },
  // Daegu
  "301": { code: "daegu_jung", nameKo: "대구 중구", sido: "대구광역시", sigungu: "중구" },
  "302": { code: "daegu_dong", nameKo: "대구 동구", sido: "대구광역시", sigungu: "동구" },
  "303": { code: "daegu_seo", nameKo: "대구 서구", sido: "대구광역시", sigungu: "서구" },
  "304": { code: "daegu_nam", nameKo: "대구 남구", sido: "대구광역시", sigungu: "남구" },
  "305": { code: "daegu_buk", nameKo: "대구 북구", sido: "대구광역시", sigungu: "북구" },
  "306": { code: "daegu_suseong", nameKo: "대구 수성구", sido: "대구광역시", sigungu: "수성구" },
  "307": { code: "daegu_dalseo", nameKo: "대구 달서구", sido: "대구광역시", sigungu: "달서구" },
  // Incheon
  "401": { code: "incheon_jung", nameKo: "인천 중구", sido: "인천광역시", sigungu: "중구" },
  "402": { code: "incheon_dong", nameKo: "인천 동구", sido: "인천광역시", sigungu: "동구" },
  "403": { code: "incheon_nam", nameKo: "인천 남구", sido: "인천광역시", sigungu: "남구" },
  "404": { code: "incheon_yeonsu", nameKo: "인천 연수구", sido: "인천광역시", sigungu: "연수구" },
  "405": { code: "incheon_namdong", nameKo: "인천 남동구", sido: "인천광역시", sigungu: "남동구" },
  "406": { code: "incheon_bupyeong", nameKo: "인천 부평구", sido: "인천광역시", sigungu: "부평구" },
  "407": { code: "incheon_gyeyang", nameKo: "인천 계양구", sido: "인천광역시", sigungu: "계양구" },
  "408": { code: "incheon_seo", nameKo: "인천 서구", sido: "인천광역시", sigungu: "서구" },
  // Gwangju
  "501": { code: "gwangju_dong", nameKo: "광주 동구", sido: "광주광역시", sigungu: "동구" },
  "502": { code: "gwangju_seo", nameKo: "광주 서구", sido: "광주광역시", sigungu: "서구" },
  "503": { code: "gwangju_nam", nameKo: "광주 남구", sido: "광주광역시", sigungu: "남구" },
  "504": { code: "gwangju_buk", nameKo: "광주 북구", sido: "광주광역시", sigungu: "북구" },
  "505": { code: "gwangju_gwangsan", nameKo: "광주 광산구", sido: "광주광역시", sigungu: "광산구" },
  // Daejeon
  "601": { code: "daejeon_dong", nameKo: "대전 동구", sido: "대전광역시", sigungu: "동구" },
  "602": { code: "daejeon_jung", nameKo: "대전 중구", sido: "대전광역시", sigungu: "중구" },
  "603": { code: "daejeon_seo", nameKo: "대전 서구", sido: "대전광역시", sigungu: "서구" },
  "604": { code: "daejeon_yuseong", nameKo: "대전 유성구", sido: "대전광역시", sigungu: "유성구" },
  "605": { code: "daejeon_daedeok", nameKo: "대전 대덕구", sido: "대전광역시", sigungu: "대덕구" },
  // Ulsan
  "701": { code: "ulsan_jung", nameKo: "울산 중구", sido: "울산광역시", sigungu: "중구" },
  "702": { code: "ulsan_nam", nameKo: "울산 남구", sido: "울산광역시", sigungu: "남구" },
  "703": { code: "ulsan_dong", nameKo: "울산 동구", sido: "울산광역시", sigungu: "동구" },
  "704": { code: "ulsan_buk", nameKo: "울산 북구", sido: "울산광역시", sigungu: "북구" },
  // Sejong
  "800": { code: "sejong", nameKo: "세종", sido: "세종특별자치시", sigungu: "세종시" },
  // Gyeonggi
  "131": { code: "gyeonggi_suwon", nameKo: "경기 수원", sido: "경기도", sigungu: "수원시" },
  "132": { code: "gyeonggi_seongnam", nameKo: "경기 성남", sido: "경기도", sigungu: "성남시" },
  "133": { code: "gyeonggi_uijeongbu", nameKo: "경기 의정부", sido: "경기도", sigungu: "의정부시" },
  "134": { code: "gyeonggi_anyang", nameKo: "경기 안양", sido: "경기도", sigungu: "안양시" },
  "135": { code: "gyeonggi_bucheon", nameKo: "경기 부천", sido: "경기도", sigungu: "부천시" },
  "136": { code: "gyeonggi_gwangmyeong", nameKo: "경기 광명", sido: "경기도", sigungu: "광명시" },
  "137": { code: "gyeonggi_pyeongtaek", nameKo: "경기 평택", sido: "경기도", sigungu: "평택시" },
  "138": { code: "gyeonggi_ansan", nameKo: "경기 안산", sido: "경기도", sigungu: "안산시" },
  "139": { code: "gyeonggi_goyang", nameKo: "경기 고양", sido: "경기도", sigungu: "고양시" },
  "140": { code: "gyeonggi_gwacheon", nameKo: "경기 과천", sido: "경기도", sigungu: "과천시" },
  "141": { code: "gyeonggi_namyangju", nameKo: "경기 남양주", sido: "경기도", sigungu: "남양주시" },
  "142": { code: "gyeonggi_osan", nameKo: "경기 오산", sido: "경기도", sigungu: "오산시" },
  "143": { code: "gyeonggi_siheung", nameKo: "경기 시흥", sido: "경기도", sigungu: "시흥시" },
  "144": { code: "gyeonggi_gunpo", nameKo: "경기 군포", sido: "경기도", sigungu: "군포시" },
  "145": { code: "gyeonggi_uiwang", nameKo: "경기 의왕", sido: "경기도", sigungu: "의왕시" },
  "146": { code: "gyeonggi_hanam", nameKo: "경기 하남", sido: "경기도", sigungu: "하남시" },
  "147": { code: "gyeonggi_yongin", nameKo: "경기 용인", sido: "경기도", sigungu: "용인시" },
  "148": { code: "gyeonggi_paju", nameKo: "경기 파주", sido: "경기도", sigungu: "파주시" },
  "149": { code: "gyeonggi_icheon", nameKo: "경기 이천", sido: "경기도", sigungu: "이천시" },
  "150": { code: "gyeonggi_anseong", nameKo: "경기 안성", sido: "경기도", sigungu: "안성시" },
  "151": { code: "gyeonggi_gimpo", nameKo: "경기 김포", sido: "경기도", sigungu: "김포시" },
  "152": { code: "gyeonggi_hwaseong", nameKo: "경기 화성", sido: "경기도", sigungu: "화성시" },
  "153": { code: "gyeonggi_gwangju", nameKo: "경기 광주", sido: "경기도", sigungu: "광주시" },
  "154": { code: "gyeonggi_yangju", nameKo: "경기 양주", sido: "경기도", sigungu: "양주시" },
  "155": { code: "gyeonggi_pocheon", nameKo: "경기 포천", sido: "경기도", sigungu: "포천시" },
  "156": { code: "gyeonggi_dongducheon", nameKo: "경기 동두천", sido: "경기도", sigungu: "동두천시" },
  "157": { code: "gyeonggi_gapyeong", nameKo: "경기 가평", sido: "경기도", sigungu: "가평군" },
  // Gangwon
  "221": { code: "gangwon_chuncheon", nameKo: "강원 춘천", sido: "강원특별자치도", sigungu: "춘천시" },
  "222": { code: "gangwon_wonju", nameKo: "강원 원주", sido: "강원특별자치도", sigungu: "원주시" },
  "223": { code: "gangwon_gangneung", nameKo: "강원 강릉", sido: "강원특별자치도", sigungu: "강릉시" },
  "224": { code: "gangwon_donghae", nameKo: "강원 동해", sido: "강원특별자치도", sigungu: "동해시" },
  "225": { code: "gangwon_taebaek", nameKo: "강원 태백", sido: "강원특별자치도", sigungu: "태백시" },
  "226": { code: "gangwon_sokcho", nameKo: "강원 속초", sido: "강원특별자치도", sigungu: "속초시" },
  // Chungbuk
  "431": { code: "chungbuk_cheongju", nameKo: "충북 청주", sido: "충청북도", sigungu: "청주시" },
  "432": { code: "chungbuk_chungju", nameKo: "충북 충주", sido: "충청북도", sigungu: "충주시" },
  "433": { code: "chungbuk_jecheon", nameKo: "충북 제천", sido: "충청북도", sigungu: "제천시" },
  // Chungnam
  "441": { code: "chungnam_cheonan", nameKo: "충남 천안", sido: "충청남도", sigungu: "천안시" },
  "442": { code: "chungnam_gongju", nameKo: "충남 공주", sido: "충청남도", sigungu: "공주시" },
  "443": { code: "chungnam_boryeong", nameKo: "충남 보령", sido: "충청남도", sigungu: "보령시" },
  "444": { code: "chungnam_asan", nameKo: "충남 아산", sido: "충청남도", sigungu: "아산시" },
  "445": { code: "chungnam_seosan", nameKo: "충남 서산", sido: "충청남도", sigungu: "서산시" },
  "446": { code: "chungnam_nonsan", nameKo: "충남 논산", sido: "충청남도", sigungu: "논산시" },
  // Jeonbuk
  "451": { code: "jeonbuk_jeonju", nameKo: "전북 전주", sido: "전라북도", sigungu: "전주시" },
  "452": { code: "jeonbuk_gunsan", nameKo: "전북 군산", sido: "전라북도", sigungu: "군산시" },
  "453": { code: "jeonbuk_iksan", nameKo: "전북 익산", sido: "전라북도", sigungu: "익산시" },
  "454": { code: "jeonbuk_jeongeup", nameKo: "전북 정읍", sido: "전라북도", sigungu: "정읍시" },
  // Jeonnam
  "461": { code: "jeonnam_mokpo", nameKo: "전남 목포", sido: "전라남도", sigungu: "목포시" },
  "462": { code: "jeonnam_yeosu", nameKo: "전남 여수", sido: "전라남도", sigungu: "여수시" },
  "463": { code: "jeonnam_suncheon", nameKo: "전남 순천", sido: "전라남도", sigungu: "순천시" },
  "464": { code: "jeonnam_naju", nameKo: "전남 나주", sido: "전라남도", sigungu: "나주시" },
  // Gyeongbuk
  "521": { code: "gyeongbuk_pohang", nameKo: "경북 포항", sido: "경상북도", sigungu: "포항시" },
  "522": { code: "gyeongbuk_gyeongju", nameKo: "경북 경주", sido: "경상북도", sigungu: "경주시" },
  "523": { code: "gyeongbuk_gimcheon", nameKo: "경북 김천", sido: "경상북도", sigungu: "김천시" },
  "524": { code: "gyeongbuk_andong", nameKo: "경북 안동", sido: "경상북도", sigungu: "안동시" },
  "525": { code: "gyeongbuk_gumi", nameKo: "경북 구미", sido: "경상북도", sigungu: "구미시" },
  "526": { code: "gyeongbuk_yeongju", nameKo: "경북 영주", sido: "경상북도", sigungu: "영주시" },
  "527": { code: "gyeongbuk_yeongcheon", nameKo: "경북 영천", sido: "경상북도", sigungu: "영천시" },
  "528": { code: "gyeongbuk_sangju", nameKo: "경북 상주", sido: "경상북도", sigungu: "상주시" },
  // Gyeongnam
  "531": { code: "gyeongnam_changwon", nameKo: "경남 창원", sido: "경상남도", sigungu: "창원시" },
  "532": { code: "gyeongnam_jinju", nameKo: "경남 진주", sido: "경상남도", sigungu: "진주시" },
  "533": { code: "gyeongnam_tongyeong", nameKo: "경남 통영", sido: "경상남도", sigungu: "통영시" },
  "534": { code: "gyeongnam_sacheon", nameKo: "경남 사천", sido: "경상남도", sigungu: "사천시" },
  "535": { code: "gyeongnam_gimhae", nameKo: "경남 김해", sido: "경상남도", sigungu: "김해시" },
  "536": { code: "gyeongnam_miryang", nameKo: "경남 밀양", sido: "경상남도", sigungu: "밀양시" },
  "537": { code: "gyeongnam_geoje", nameKo: "경남 거제", sido: "경상남도", sigungu: "거제시" },
  "538": { code: "gyeongnam_yangsan", nameKo: "경남 양산", sido: "경상남도", sigungu: "양산시" },
  // Jeju
  "616": { code: "jeju_jeju", nameKo: "제주 제주시", sido: "제주특별자치도", sigungu: "제주시" },
  "617": { code: "jeju_seogwipo", nameKo: "제주 서귀포시", sido: "제주특별자치도", sigungu: "서귀포시" },
};

/**
 * Returns the region info for a given Korean business number.
 * Extracts the first 3 digits (tax office prefix) to determine region.
 */
export function getRegionFromBusinessNumber(businessNumber: string): TaxOfficeRegion | null {
  const prefix = businessNumber.replace(/\D/g, "").substring(0, 3);
  return TAX_OFFICE_REGIONS[prefix] ?? null;
}

/**
 * Maps NTS sector/type strings to internal industry_code.
 * Returns "other" when no match is found.
 */
export function mapNtsSectorToIndustryCode(
  sector: string | undefined,
  type: string | undefined
): string {
  if (!sector) return "other";
  const s = sector.trim();
  if (s.includes("한식")) return "korean_restaurant";
  if (s.includes("커피") || s.includes("카페")) return "cafe";
  if (s.includes("치킨")) return "chicken";
  if (s.includes("분식")) return "bunsik";
  if (s.includes("중식") || s.includes("중화")) return "chinese_restaurant";
  if (s.includes("일식") || s.includes("초밥")) return "japanese_restaurant";
  if (s.includes("피자")) return "pizza";
  if (s.includes("제과") || s.includes("베이커리") || s.includes("빵")) return "bakery";
  if (s.includes("주류") || s.includes("주점") || s.includes("술")) return "bar";
  if (s.includes("편의점")) return "convenience";
  if (s.includes("미용") || s.includes("뷰티") || s.includes("헤어")) return "beauty";
  if (s.includes("소매") || (type && type.includes("소매"))) return "retail";
  if (s.includes("음식") || s.includes("식당")) return "korean_restaurant";
  return "other";
}

export { TAX_OFFICE_REGIONS };
