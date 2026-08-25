export interface ShippingTier {
  from_km: number;
  to_km: number;
  fee: number;
}

export interface ShopInfo {
  shop_name: string;
  hotline: string;
  address_text: string;
  announcement_banner?: string;
  latitude: number;
  longitude: number;
  max_delivery_radius_km: number;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  prep_time_minutes?: number;
  min_order_amount: number;
  min_order_for_freeship: number;
  shipping_tiers: ShippingTier[];
}

export interface Voucher {
  id: number;
  code: string;
  discount_type: "PERCENT" | "FIXED_AMOUNT";
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount: number;
  start_at: string;
  end_at: string;
  status: "ACTIVE" | "EXPIRED" | "DISABLED";
}

export interface ValidateVoucherRequest {
  code: string;
  subtotal: number;
}

export interface ValidateVoucherResponse {
  valid: boolean;
  voucher?: Voucher;
  discount_amount: number;
  message?: string;
}
