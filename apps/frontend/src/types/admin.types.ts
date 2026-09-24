import { Category } from "./category.types";
import { Product } from "./product.types";
import { Voucher } from "./cart.types";
import { ShippingTier, ShopInfo } from "./shop.types";

export interface AdminCategory extends Category {
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface AdminProduct extends Product {
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductRequest {
  category: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  status?: "AVAILABLE" | "OUT_OF_STOCK" | "INACTIVE";
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface AdminVoucher extends Voucher {
  usage_limit: number;
  usage_per_customer: number;
  start_at: string;
  end_at: string;
  status: "ACTIVE" | "INACTIVE";
  used_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVoucherRequest {
  code: string;
  name: string;
  discount_type: "FIXED" | "PERCENTAGE";
  discount_value: number;
  minimum_order_value?: number;
  maximum_discount?: number | null;
  usage_limit?: number;
  usage_per_customer?: number;
  start_at: string;
  end_at: string;
  status?: "ACTIVE" | "INACTIVE";
}

export type UpdateVoucherRequest = Partial<CreateVoucherRequest>;

export interface AdminShopConfig extends ShopInfo {
  max_delivery_radius_km: number;
  haversine_multiplier: number;
  prep_time_minutes: number;
  min_order_amount: number;
  min_order_for_freeship: number;
  shipping_tiers: ShippingTier[];
}

export type UpdateShopConfigRequest = Partial<AdminShopConfig>;
