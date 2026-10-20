import type { Product, ProductCategory } from '@prisma/client';
import { api } from './api-client';
import type { ActionResult } from './action-result';

export type ProductWithCategory = Product & { category: ProductCategory | null };

export interface GetProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  categoryId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ProductService {
  static getProducts(options: GetProductsOptions = {}) {
    return api<{ data: ProductWithCategory[]; total: number; pageCount: number }>('/api/products/query', {
      method: 'POST',
      body: options,
    });
  }

  static getCategories() {
    return api<ProductCategory[]>('/api/products/categories');
  }

  static getProductById(id: string) {
    return api<ProductWithCategory | null>(`/api/products/${id}`);
  }

  static createProduct(data: unknown) {
    return api<ActionResult<Product>>('/api/products', { method: 'POST', body: data });
  }

  static updateProduct(id: string, data: unknown) {
    return api<ActionResult<Product>>(`/api/products/${id}`, { method: 'PUT', body: data });
  }

  static adjustStock(productId: string, quantity: number, notes?: string) {
    return api<ActionResult<Product>>(`/api/products/${productId}/stock`, {
      method: 'POST',
      body: { quantity, notes },
    });
  }

  static getStockMovements(productId: string) {
    return api(`/api/products/${productId}/movements`);
  }
}
