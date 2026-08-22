import { Address } from "./customer.types";

export type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentMethod = "COD" | "BANK_TRANSFER";
export type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface OrderItemOptionPayload {
  option_id: number;
  option_name: string;
  price: number;
  quantity: number;
}

export interface OrderItemPayload {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  note?: string;
  options?: OrderItemOptionPayload[];
}

export interface OrderItemOptionResponse {
  id: number;
  option: number;
  option_name: string;
  price: number;
  quantity: number;
}

export interface OrderItemResponse {
  id: number;
  product: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  note?: string;
  options: OrderItemOptionResponse[];
}

export interface PaymentResponse {
  id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  actual_paid_amount?: number;
  qr_code_url?: string;
  paid_at?: string;
  note?: string;
}

export interface Order {
  id: number;
  order_code: string;
  customer?: number;
  status: OrderStatus;
  status_display?: string;
  recipient_name: string;
  phone: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  distance_km: number;
  shipping_fee: number;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  note?: string;
  created_at: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  items: OrderItemResponse[];
  payment?: PaymentResponse;
}

export interface CheckoutPreviewRequest {
  items: OrderItemPayload[];
  delivery_latitude: number;
  delivery_longitude: number;
  voucher_code?: string;
}

export interface CheckoutPreviewResponse {
  subtotal: number;
  distance_km: number;
  shipping_fee: number;
  discount: number;
  total_amount: number;
  voucher_code?: string;
  is_valid: boolean;
  message?: string;
}

export interface CreateOrderRequest {
  recipient_name: string;
  phone: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  payment_method: PaymentMethod;
  note?: string;
  voucher_code?: string;
  items: OrderItemPayload[];
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page?: number;
  page_size?: number;
}
