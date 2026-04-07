import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// Mock useAuth hook
const mockSignOut = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}));

import { Sidebar, agentNavItems } from "../sidebar";

describe("Sidebar", () => {
  const defaultProps = {
    userEmail: "test@example.com",
    businessName: "Test Store",
    subscriptionStatus: "active" as const,
    businesses: [
      { id: "biz-1", name: "Test Store" },
      { id: "biz-2", name: "Second Store" },
    ],
    currentBusinessId: "biz-1",
  };

  it("renders the app title", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("사장AI")).toBeInTheDocument();
  });

  it("renders all 4 agent nav items", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("점장")).toBeInTheDocument();
    expect(screen.getByText("세리")).toBeInTheDocument();
    expect(screen.getByText("답장이")).toBeInTheDocument();
    expect(screen.getByText("바이럴")).toBeInTheDocument();
  });

  it("renders agent role descriptions", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("홈 · 종합 브리핑")).toBeInTheDocument();
    expect(screen.getByText("매출 분석")).toBeInTheDocument();
    expect(screen.getByText("리뷰 분석")).toBeInTheDocument();
    expect(screen.getByText("마케팅")).toBeInTheDocument();
  });

  it("contains data management section with links", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("데이터 관리")).toBeInTheDocument();
    expect(screen.getByText("매출/매입")).toBeInTheDocument();
    expect(screen.getByText("고정비")).toBeInTheDocument();
    expect(screen.getByText("계산서")).toBeInTheDocument();
    expect(screen.getByText("거래처")).toBeInTheDocument();
  });

  it("renders links with correct href paths", () => {
    render(<Sidebar {...defaultProps} />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/analysis");
    expect(hrefs).toContain("/review");
    expect(hrefs).toContain("/marketing");
    expect(hrefs).toContain("/ledger");
  });

  it("shows active state for current pathname", () => {
    // pathname is /dashboard, so the 점장 link should have active style
    render(<Sidebar {...defaultProps} />);
    const dashboardLink = screen.getByText("점장").closest("a");
    expect(dashboardLink?.className).toContain("bg-[#EFF6FF]");
  });

  it("displays business name and user email", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Test Store")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows subscription status badge", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("점장 고용 중")).toBeInTheDocument();
  });

  it("shows trial badge for trial subscription", () => {
    render(<Sidebar {...{ ...defaultProps, subscriptionStatus: "trial" }} />);
    expect(screen.getByText("무료 체험 중")).toBeInTheDocument();
  });

  it("exports agentNavItems with correct count", () => {
    expect(agentNavItems).toHaveLength(4);
    expect(agentNavItems.map((n) => n.name)).toEqual(["점장", "세리", "답장이", "바이럴"]);
  });

  it("renders logout button", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("로그아웃")).toBeInTheDocument();
  });
});
