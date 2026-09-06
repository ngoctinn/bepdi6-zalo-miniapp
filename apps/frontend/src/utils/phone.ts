import { openPhone } from "zmp-sdk/apis";

/**
 * Kích hoạt cuộc gọi điện thoại thông qua ZMP SDK openPhone API.
 * Tự động chuẩn hóa số điện thoại và fallback về tel: nếu chạy ngoài môi trường Zalo.
 */
export const makePhoneCall = async (
  phoneNumber?: string | null,
): Promise<void> => {
  if (!phoneNumber) return;
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");
  if (!cleanPhone) return;

  try {
    await openPhone({
      phoneNumber: cleanPhone,
    });
  } catch (error) {
    console.warn(
      "[Phone] openPhone failed or not in Zalo mobile client, falling back to tel:",
      error,
    );
    window.location.href = `tel:${cleanPhone}`;
  }
};
