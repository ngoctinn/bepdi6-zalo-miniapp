export interface Customer {
  id: number;
  zalo_user_id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  created_at: string;
}

export interface Address {
  id: number;
  customer?: number;
  recipient_name: string;
  phone: string;
  address_text: string;
  latitude: number;
  longitude: number;
  label?: string;
  is_default: boolean;
  created_at?: string;
}

export interface CreateAddressRequest {
  recipient_name: string;
  phone: string;
  address_text: string;
  latitude: number;
  longitude: number;
  label?: string;
  is_default?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

export interface ZaloAuthRequest {
  access_token: string;
  phone_token?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  access?: string;
  refresh?: string;
  customer: Customer;
}

export interface DecodeLocationResponse {
  latitude: number;
  longitude: number;
  address_text: string;
}
