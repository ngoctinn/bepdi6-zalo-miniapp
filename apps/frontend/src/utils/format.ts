import tokens from "@/tokens";

const DEFAULT_LOCALE = "vi-VN";

export const formatCurrency = (
  value: number | string,
  locale: string = DEFAULT_LOCALE,
): string => {
  if (value === undefined || value === null) return "0";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "0";
  return Math.round(num).toLocaleString(locale);
};

export const formatCount = (value: number, max = 99) =>
  value > max ? tokens.text.common.countOverflow : String(value);
