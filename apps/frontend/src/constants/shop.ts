/**
 * Centralized Shop and Banking Configurations
 */

export const DEFAULT_SHOP_COORDINATES = {
  latitude: 10.762622,
  longitude: 106.660172,
} as const;

export const DEFAULT_SHOP_ADDRESS =
  "123 Đường Ẩm Thực, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh";

export const DEFAULT_BANK_CONFIG = {
  bankCode: "TCB",
  bankName: "Techcombank",
  accountNumber: "2907200329",
  accountHolderName: "NGUYEN NGOC TIN",
} as const;

export interface VietQrOptions {
  amount: number;
  orderCode: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  template?: string;
}

export function getVietQrUrl(options: VietQrOptions): string {
  const bank = options.bankCode || DEFAULT_BANK_CONFIG.bankCode;
  const accNum = options.accountNumber || DEFAULT_BANK_CONFIG.accountNumber;
  const accName =
    options.accountHolderName || DEFAULT_BANK_CONFIG.accountHolderName;
  const template = options.template || "compact2";

  return `https://img.vietqr.io/image/${bank}-${accNum}-${template}.png?amount=${Math.round(
    options.amount,
  )}&addInfo=${encodeURIComponent(options.orderCode)}&accountName=${encodeURIComponent(
    accName,
  )}`;
}
