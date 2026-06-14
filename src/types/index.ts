export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface PaginatedResponse<T> {
  items?: T[];
  data?: T[];
  pagination: PaginationMeta;
}

export interface CartState {
  items: Array<{
    productId: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    quantity: number;
    stock: number;
    sku?: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: number;
  ordersGrowth: number;
  productsGrowth: number;
  customersGrowth: number;
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface TopProduct {
  _id: string;
  name: string;
  slug: string;
  image: string;
  soldQuantity: number;
  revenue: number;
}
