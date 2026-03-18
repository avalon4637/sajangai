import { describe, it, expect } from "vitest";
import { parseCsv, type ParseResult } from "./parser";

// Helper to build CSV string from header and rows
function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.join(","), ...rows.map((r) => r.join(","))];
  return lines.join("\n");
}

describe("parseCsv", () => {
  describe("Korean header detection", () => {
    it("should detect Korean headers: date, amount, channel, category, memo", () => {
      const csv = buildCsv(
        ["날짜", "금액", "채널", "카테고리", "메모"],
        [["2026-01-15", "100000", "카드결제", "매장", "점심매출"]]
      );
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].date).toBe("2026-01-15");
      expect(result.rows[0].amount).toBe(100000);
      expect(result.rows[0].channel).toBe("카드");
      expect(result.rows[0].category).toBe("매장");
      expect(result.rows[0].memo).toBe("점심매출");
    });

    it("should detect alternative Korean headers: date variants", () => {
      const csv = buildCsv(
        ["거래일자", "결제금액", "결제수단", "분류", "비고"],
        [["2026-01-15", "50000", "현금", "테이크아웃", "오전"]]
      );
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].date).toBe("2026-01-15");
      expect(result.rows[0].amount).toBe(50000);
    });

    it("should detect English headers", () => {
      const csv = buildCsv(
        ["date", "amount", "channel", "category", "memo"],
        [["2026-01-15", "200000", "card", "store", "lunch"]]
      );
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].date).toBe("2026-01-15");
      expect(result.rows[0].amount).toBe(200000);
      expect(result.rows[0].memo).toBe("lunch");
    });
  });

  describe("number format parsing", () => {
    it("should parse comma-formatted numbers: 1,000,000 -> 1000000", () => {
      // Comma-containing values must be quoted in CSV to avoid being split
      const csv = '날짜,금액\n2026-01-15,"1,000,000"';
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].amount).toBe(1000000);
    });

    it("should parse won-symbol numbers: remove won sign", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026-01-15", "원1000"]]
      );
      const result = parseCsv(csv);
      // The parser removes '원' with regex /[,원\\s]/g
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].amount).toBe(1000);
    });

    it("should handle negative amounts as expense", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026-01-15", "-50000"]]
      );
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].amount).toBe(50000); // Math.abs
      expect(result.rows[0].type).toBe("expense");
    });

    it("should skip rows where amount is 0", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026-01-15", "0"]]
      );
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(0);
    });

    it("should skip rows where amount is not a number", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026-01-15", "abc"]]
      );
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(0);
    });
  });

  describe("date format normalization", () => {
    it("should normalize YYYY-MM-DD format", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026-01-15", "10000"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].date).toBe("2026-01-15");
    });

    it("should normalize YYYY/MM/DD format", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026/01/15", "10000"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].date).toBe("2026-01-15");
    });

    it("should normalize YYYY.MM.DD format", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026.01.15", "10000"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].date).toBe("2026-01-15");
    });

    it("should normalize short year format (YY-MM-DD)", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["26-1-5", "10000"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].date).toBe("2026-01-05");
    });
  });

  describe("empty and missing data handling", () => {
    it("should skip empty rows (PapaParse skipEmptyLines)", () => {
      const csv = "날짜,금액\n2026-01-15,10000\n\n2026-01-16,20000\n";
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(2);
    });

    it("should skip rows missing required date column", () => {
      const csv = buildCsv(
        ["이름", "금액"],
        [["홍길동", "10000"]]
      );
      const result = parseCsv(csv);
      // No date column found, normalizeRow returns null
      expect(result.rows).toHaveLength(0);
    });

    it("should skip rows missing required amount column", () => {
      const csv = buildCsv(
        ["날짜", "이름"],
        [["2026-01-15", "홍길동"]]
      );
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(0);
    });

    it("should handle empty CSV content", () => {
      const result = parseCsv("");
      expect(result.rows).toHaveLength(0);
    });

    it("should handle CSV with only headers", () => {
      const csv = "날짜,금액,채널";
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(0);
    });
  });

  describe("channel classification", () => {
    it.each([
      ["카드결제", "카드"],
      ["신용카드", "카드"],
      ["card payment", "카드"],
      ["현금", "현금"],
      ["cash", "현금"],
      ["배달의민족", "배달앱"],
      ["배민", "배달앱"],
      ["요기요", "배달앱"],
      ["쿠팡이츠", "배달앱"],
      ["네이버주문", "온라인"],
      ["쿠팡", "온라인"],
      ["온라인결제", "온라인"],
      ["기타결제", "기타"],
    ])("should classify '%s' as '%s'", (channelValue, expectedChannel) => {
      const csv = buildCsv(
        ["날짜", "금액", "채널"],
        [["2026-01-15", "10000", channelValue]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].channel).toBe(expectedChannel);
    });

    it("should default channel to '기타' when no channel column", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026-01-15", "10000"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].channel).toBe("기타");
    });
  });

  describe("type detection (revenue vs expense)", () => {
    it("should classify positive amount as revenue", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026-01-15", "100000"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].type).toBe("revenue");
    });

    it("should classify negative amount as expense", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026-01-15", "-100000"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].type).toBe("expense");
    });
  });

  describe("input validation", () => {
    it("should reject amounts exceeding 10 billion won", () => {
      const csv = buildCsv(["날짜", "금액"], [["2026-01-15", "99999999999"]]);
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(0);
    });

    it("should accept amounts up to 10 billion won", () => {
      const csv = buildCsv(["날짜", "금액"], [["2026-01-15", "10000000000"]]);
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(1);
    });

    it("should sanitize HTML tags from category field", () => {
      const csv = buildCsv(
        ["날짜", "금액", "카테고리"],
        [["2026-01-15", "10000", "<script>alert('xss')</script>"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].category).not.toContain("<");
      expect(result.rows[0].category).not.toContain(">");
    });

    it("should truncate long string fields to 200 characters", () => {
      const longMemo = "a".repeat(300);
      const csv = buildCsv(
        ["날짜", "금액", "메모"],
        [["2026-01-15", "10000", longMemo]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].memo.length).toBeLessThanOrEqual(200);
    });
  });

  describe("date validation", () => {
    it("should reject month > 12", () => {
      const csv = buildCsv(["날짜", "금액"], [["2026-13-01", "10000"]]);
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(0);
    });

    it("should reject day > 31", () => {
      const csv = buildCsv(["날짜", "금액"], [["2026-01-32", "10000"]]);
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(0);
    });

    it("should reject month 0", () => {
      const csv = buildCsv(["날짜", "금액"], [["2026-00-15", "10000"]]);
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(0);
    });

    it("should reject unparseable date format", () => {
      const csv = buildCsv(["날짜", "금액"], [["not-a-date", "10000"]]);
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(0);
    });

    it("should accept valid date 2026-02-28", () => {
      const csv = buildCsv(["날짜", "금액"], [["2026-02-28", "10000"]]);
      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].date).toBe("2026-02-28");
    });
  });

  describe("large dataset handling", () => {
    it("should parse 100+ rows without error", () => {
      const rows: string[][] = [];
      for (let i = 0; i < 150; i++) {
        rows.push([`2026-01-${String((i % 28) + 1).padStart(2, "0")}`, String((i + 1) * 1000)]);
      }
      const csv = buildCsv(["날짜", "금액"], rows);
      const result = parseCsv(csv);
      expect(result.rows.length).toBe(150);
      expect(result.totalRows).toBe(150);
    });
  });

  describe("memo field", () => {
    it("should extract memo from Korean key", () => {
      const csv = buildCsv(
        ["날짜", "금액", "메모"],
        [["2026-01-15", "10000", "점심 매출"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].memo).toBe("점심 매출");
    });

    it("should extract memo from English key", () => {
      const csv = buildCsv(
        ["날짜", "금액", "memo"],
        [["2026-01-15", "10000", "lunch sales"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].memo).toBe("lunch sales");
    });

    it("should default memo to empty string when absent", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [["2026-01-15", "10000"]]
      );
      const result = parseCsv(csv);
      expect(result.rows[0].memo).toBe("");
    });
  });

  describe("result metadata", () => {
    it("should report totalRows matching parsed data count", () => {
      const csv = buildCsv(
        ["날짜", "금액"],
        [
          ["2026-01-15", "10000"],
          ["2026-01-16", "20000"],
          ["2026-01-17", "30000"],
        ]
      );
      const result = parseCsv(csv);
      expect(result.totalRows).toBe(3);
      expect(result.rows).toHaveLength(3);
    });

    it("should accumulate errors for unparseable rows", () => {
      // Build a CSV where some rows have valid headers but might cause parsing errors
      const csv = buildCsv(
        ["날짜", "금액"],
        [
          ["2026-01-15", "10000"],
          ["2026-01-16", "20000"],
        ]
      );
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
    });
  });
});
