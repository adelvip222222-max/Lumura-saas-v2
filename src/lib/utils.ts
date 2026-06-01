// src/lib/utils.ts
export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number | string, currency = "EGP") {
  const num = typeof value === "string" ? parseFloat(value) || 0 : value || 0;
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency }).format(num);
}

// ✅ إضافة الدالة المفقودة getInitials
export function getInitials(name: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ✅ إضافة دالة formatDate (قد تحتاجها أيضاً)
export function formatDate(date: Date | string, locale = "ar-EG"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

// ✅ إضافة دالة truncate (لاختصار النصوص)
export function truncate(text: string, length: number = 100): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

export function formatRelativeTime(date: Date | string, locale = "ar-EG"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, ms] of units) {
    if (absMs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }

  return rtf.format(0, "second");
}

export default generateSlug;
