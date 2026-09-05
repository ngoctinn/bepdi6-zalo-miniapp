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

/**
 * Bóc tách tiền tố số nhà/ngõ hẻm từ chuỗi tìm kiếm địa chỉ tiếng Việt.
 * Ví dụ: "45 Đồng Nai" -> { houseNumber: "45", searchQuery: "Đồng Nai" }
 *        "123/45A Lê Văn Sỹ" -> { houseNumber: "123/45A", searchQuery: "Lê Văn Sỹ" }
 *        "Số 12 Quang Trung" -> { houseNumber: "Số 12", searchQuery: "Quang Trung" }
 */
export function parseVietnameseAddressInput(input: string): {
  houseNumber: string;
  searchQuery: string;
} {
  const trimmed = input.trim();
  const match = trimmed.match(
    /^(số\s+\d+[\w/]*|hẻm\s+\d+[\w/]*|căn\s+[\w/]+|\d+[\w/]*[a-zA-Z]?)\s+(.+)$/i,
  );
  if (match) {
    return {
      houseNumber: match[1].trim(),
      searchQuery: match[2].trim(),
    };
  }
  return {
    houseNumber: "",
    searchQuery: trimmed,
  };
}
