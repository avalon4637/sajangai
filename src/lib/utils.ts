import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the last day of a month from "YYYY-MM" format string
export function getLastDayOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
}

/**
 * Validate yearMonth format matches YYYY-MM pattern.
 * @param yearMonth - String to validate
 * @throws Error if format is invalid
 */
export function validateYearMonth(yearMonth: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    throw new Error(
      `Invalid yearMonth format: "${yearMonth}". Expected YYYY-MM.`
    );
  }
}

/**
 * Filter fixed costs that are active during a given month.
 * A cost is active if its date range overlaps with the month.
 * @param costs - Array of fixed cost records with start_date and end_date
 * @param monthStart - First day of month in YYYY-MM-DD format
 * @param monthEnd - Last day of month in YYYY-MM-DD format
 * @returns Filtered array of active fixed costs
 */
export function filterActiveFixedCosts<
  T extends { start_date: string | null; end_date: string | null }
>(costs: T[], monthStart: string, monthEnd: string): T[] {
  return costs.filter((f) => {
    const startOk = !f.start_date || f.start_date <= monthEnd;
    const endOk = !f.end_date || f.end_date >= monthStart;
    return startOk && endOk;
  });
}
