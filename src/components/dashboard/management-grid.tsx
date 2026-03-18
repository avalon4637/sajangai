import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ManagementGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 가게 정보 */}
      <Card>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex flex-col gap-3 h-full">
            <div className="flex items-start gap-2">
              <span className="text-xl">🏪</span>
              <div>
                <p className="font-semibold text-sm leading-tight">가게 정보</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  사업자정보, 업종, 주소 관리
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-auto text-xs"
              asChild
            >
              <Link href="/settings">정보 수정</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 카카오톡 알림 */}
      <Card>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex flex-col gap-3 h-full">
            <div className="flex items-start gap-2">
              <span className="text-xl">💬</span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm leading-tight">카카오톡 알림</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  알림 동의 상태 · 발신 내역
                </p>
              </div>
            </div>
            <div className="mt-auto">
              <Badge
                variant="outline"
                className="text-xs border-yellow-400 text-yellow-600 bg-yellow-50"
              >
                미동의
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 일일 리포트 */}
      <Card>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex flex-col gap-3 h-full">
            <div className="flex items-start gap-2">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-semibold text-sm leading-tight">일일 리포트</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  최근 7일간 리포트 확인
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-auto text-xs"
              asChild
            >
              <Link href="/analysis">리포트 보기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 정보 연결 */}
      <Card>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex flex-col gap-3 h-full">
            <div className="flex items-start gap-2">
              <span className="text-xl">🔗</span>
              <div>
                <p className="font-semibold text-sm leading-tight">정보 연결</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  배달앱 · 카드매출 연동 상태
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-auto text-xs"
              asChild
            >
              <Link href="/settings">연결 설정</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
