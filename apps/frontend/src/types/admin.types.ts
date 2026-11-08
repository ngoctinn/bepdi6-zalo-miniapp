import { Category } from "./category.types";
import { Product } from "./product.types";
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

export interface AdminOptionInput {
  id?: number;
  name: string;
  price: number | string;
  status?: "AVAILABLE" | "INACTIVE";
  sort_order?: number;
}

export interface AdminOptionGroupInput {
  id?: number;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  sort_order?: number;
  options?: AdminOptionInput[];
}

export interface AdminProductPromotionInput {
  promotional_price: number;
  is_active?: boolean;
  valid_from?: string | null;
  valid_to?: string | null;
  note?: string;
}

export interface CreateProductRequest {
  category_id: number;
  category?: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_featured?: boolean;
  sort_order?: number;
  status?: "AVAILABLE" | "OUT_OF_STOCK" | "INACTIVE";
  option_groups?: AdminOptionGroupInput[];
  promotion?: AdminProductPromotionInput | null;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface DeleteProductResponse {
  id: number;
  soft_deleted: boolean;
  status?: "AVAILABLE" | "OUT_OF_STOCK" | "INACTIVE";
  message?: string;
}

export interface UploadImageResponse {
  image_url: string;
}

export interface AdminVoucher {
  id: number;
  code: string;
  name: string;
  discount_type: "FIXED" | "PERCENTAGE";
  discount_value: number | string;
  minimum_order_value?: number | string;
  maximum_discount?: number | string | null;
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

export interface AdminDashboardStats {
  today_revenue: number;
  today_completed_count: number;
  pending_count: number;
  preparing_count: number;
  ready_count: number;
  total_orders_count: number;
  total_products_count?: number;
  active_vouchers_count?: number;
}

export interface AdminCustomer {
  id: number;
  zalo_user_id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStaffUser {
  id: number;
  username: string;
  phone?: string;
  zalo_user_id?: string;
  name?: string;
  role: "ADMIN" | "STAFF";
  is_staff: boolean;
  date_joined?: string;
  created_at?: string;
}

export interface CreateStaffInviteRequest {
  role: "STAFF" | "ADMIN";
}

export interface CreateStaffInviteResponse {
  token: string;
  role: "STAFF" | "ADMIN";
  expires_at: string;
}

export interface AcceptStaffInviteRequest {
  token: string;
}

export interface AcceptStaffInviteResponse {
  role: "STAFF" | "ADMIN";
  access_token: string;
  refresh_token: string;
}
