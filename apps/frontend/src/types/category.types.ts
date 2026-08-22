export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  image_url?: string;
  effective_image_url?: string;
  sort_order: number;
  status: "ACTIVE" | "INACTIVE";
}
