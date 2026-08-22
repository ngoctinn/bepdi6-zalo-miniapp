export interface Option {
  id: number;
  option_group: number;
  name: string;
  price: number;
  status: "AVAILABLE" | "INACTIVE";
  sort_order?: number;
}

export interface OptionGroup {
  id: number;
  product: number;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  sort_order?: number;
  options: Option[];
}

export interface Product {
  id: number;
  category: number;
  category_name?: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  image_url?: string;
  effective_image_url?: string;
  status: "AVAILABLE" | "OUT_OF_STOCK" | "INACTIVE";
  is_featured?: boolean;
  sort_order?: number;
  option_groups?: OptionGroup[];
}

export interface ProductListParams {
  category?: number;
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
}
