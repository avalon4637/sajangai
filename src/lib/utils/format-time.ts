// Relative time formatting utility for KST timezone
// No external dependencies — uses native Date API

const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // UTC+9

function toKST(date: Date): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + KST_OFFSET_MS);
}

/**
 * Format a date string as relative time in Korean.
 *
 * - Within 1 minute: "방금 전"
 * - Within 1 hour: "N분 전"
 * - Within 24 hours: "N시간 전"
 * - Yesterday: "어제 HH:MM"
 * - Otherwise: "M월 D일 HH:MM"
 *
 * All times are displayed in KST.
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;

  const kstDate = toKST(date);
  const kstNow = toKST(now);

  const hh = String(kstDate.getHours()).padStart(2, "0");
  const mm = String(kstDate.getMinutes()).padStart(2, "0");

  // Check if yesterday
  const todayStart = new Date(
    kstNow.getFullYear(),
    kstNow.getMonth(),
    kstNow.getDate(),
  );
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  if (kstDate >= yesterdayStart && kstDate < todayStart) {
    return `어제 ${hh}:${mm}`;
  }

  const month = kstDate.getMonth() + 1;
  const day = kstDate.getDate();
  return `${month}월 ${day}일 ${hh}:${mm}`;
}

/**
 * Format a date string as short time for chat messages.
 * Returns "HH:MM" in KST for today, or relative time for older messages.
 */
export function formatChatTime(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const kstDate = toKST(date);
  const kstNow = toKST(now);

  const isSameDay =
    kstDate.getFullYear() === kstNow.getFullYear() &&
    kstDate.getMonth() === kstNow.getMonth() &&
    kstDate.getDate() === kstNow.getDate();

  if (isSameDay) {
    const hh = String(kstDate.getHours()).padStart(2, "0");
    const mm = String(kstDate.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return formatRelativeTime(dateString);
}
