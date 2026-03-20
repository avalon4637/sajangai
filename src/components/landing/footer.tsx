import Link from "next/link";

const BUSINESS_INFO = {
  companyName: "이블링",
  representativeName: "김다영 (대표)",
  businessNumber: "685-52-00101",
  address: "경기도 부천시 원미구 부일로 243번길 11",
  phone: "010-2093-9980",
  email: "purrpurr.ai@gmail.com",
  salesRegistrationNumber: "2016-경기부천-1257",
  serviceName: "사장 AI (sajang.ai)",
};

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[#71717A] text-[11px]">{label}</span>
      <span className="text-[#A1A1AA] text-[13px]">{value}</span>
    </div>
  );
}

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#18181B]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-[120px] py-10">
        {/* Business Info */}
        <div className="mb-6">
          <h3 className="text-[#A1A1AA] text-xs font-semibold mb-4">
            사업자 정보
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
            <InfoItem label="상호명" value={BUSINESS_INFO.companyName} />
            <InfoItem
              label="대표자명"
              value={BUSINESS_INFO.representativeName}
            />
            <InfoItem
              label="사업자등록번호"
              value={BUSINESS_INFO.businessNumber}
            />
            <InfoItem
              label="통신판매업 신고번호"
              value={BUSINESS_INFO.salesRegistrationNumber}
            />
            <InfoItem label="전화번호" value={BUSINESS_INFO.phone} />
            <InfoItem label="이메일" value={BUSINESS_INFO.email} />
            <div className="sm:col-span-2 lg:col-span-3">
              <InfoItem label="사업장 주소" value={BUSINESS_INFO.address} />
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-[#27272A] pt-4 mb-4">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href="/terms"
              className="text-[#71717A] hover:text-[#A1A1AA] text-[13px] transition-colors"
            >
              서비스 이용약관
            </Link>
            <span className="text-[#3F3F46]">|</span>
            <Link
              href="/privacy"
              className="text-[#71717A] hover:text-[#A1A1AA] text-[13px] transition-colors"
            >
              개인정보처리방침
            </Link>
            <span className="text-[#3F3F46]">|</span>
            <Link
              href="/refund-policy"
              className="text-[#71717A] hover:text-[#A1A1AA] text-[13px] transition-colors"
            >
              환불정책
            </Link>
            <span className="text-[#3F3F46]">|</span>
            <a
              href={`mailto:${BUSINESS_INFO.email}`}
              className="text-[#71717A] hover:text-[#A1A1AA] text-[13px] transition-colors"
            >
              문의하기
            </a>
          </nav>
        </div>

        {/* Payment + Copyright */}
        <div className="border-t border-[#27272A] pt-4 text-center space-y-1">
          <p className="text-[#52525B] text-[11px]">
            결제 대행: ㈜포트원 (PortOne)
          </p>
          <p className="text-[#52525B] text-[11px]">
            © {currentYear} {BUSINESS_INFO.companyName} (
            {BUSINESS_INFO.serviceName}). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
