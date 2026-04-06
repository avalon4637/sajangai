// Mid-page CTA — between Features and Insight Showcase

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MidCTA() {
  return (
    <section className="py-12 text-center">
      <p className="text-muted-foreground mb-4">
        지금 바로 점장을 만나보세요
      </p>
      <Link href="/auth/signup">
        <Button size="lg" className="rounded-full px-8">
          7일 무료 체험 시작하기 →
        </Button>
      </Link>
    </section>
  );
}
