// Mid-page CTA — between Features and Insight Showcase

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MidCTA() {
  return (
    <section className="py-12 text-center">
      <p className="text-muted-foreground mb-4">
        지금 바로 점장을 만나보세요
      </p>
      <Button size="lg" asChild className="rounded-full px-8">
        <Link href="/auth/signup">
          7일 무료 체험 시작하기 →
        </Link>
      </Button>
    </section>
  );
}
