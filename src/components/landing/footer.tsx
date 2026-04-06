import Link from "next/link";

const BUSINESS_INFO = {
  companyName: "이블링",
  representativeName: "김다영 (대표)",
  businessNumber: "685-52-00101",
  address: "경기도 부천시 원미구 부일로 243번길 11",
  phone: "010-2093-9980",
  email: "purrpurr.ai@gmail.com",
  salesRegistrationNumber: "2016-경기부천-1257",
  serviceName: "sajang.ai · Agentra Inc.",
};

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-zinc-500 text-[11px]">{label}</span>
      <span className="text-zinc-400 text-[13px]">{value}</span>
    </div>
  );
}

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[120px] py-10">
        {/* Business Info */}
        <div className="mb-6">
          <h3 className="text-zinc-400 text-xs font-semibold mb-4">
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
        <div className="border-t border-zinc-800 pt-4 mb-4">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href="/terms"
              className="text-zinc-500 hover:text-zinc-300 text-[13px] transition-colors"
            >
              서비스 이용약관
            </Link>
            <span className="text-zinc-700">|</span>
            <Link
              href="/privacy"
              className="text-zinc-500 hover:text-zinc-300 text-[13px] transition-colors"
            >
              개인정보처리방침
            </Link>
            <span className="text-zinc-700">|</span>
            <Link
              href="/refund-policy"
              className="text-zinc-500 hover:text-zinc-300 text-[13px] transition-colors"
            >
              환불정책
            </Link>
            <span className="text-zinc-700">|</span>
            <a
              href={`mailto:${BUSINESS_INFO.email}`}
              className="text-zinc-500 hover:text-zinc-300 text-[13px] transition-colors"
            >
              문의하기
            </a>
          </nav>
        </div>

        {/* Payment + Copyright */}
        <div className="border-t border-zinc-800 pt-4 text-center space-y-1">
          <p className="text-zinc-600 text-[11px]">
            결제 대행: ㈜포트원 (PortOne)
          </p>
          <p className="text-zinc-600 text-[11px]">
            &copy; {currentYear} {BUSINESS_INFO.companyName} (
            {BUSINESS_INFO.serviceName}). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
