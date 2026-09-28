'use server';

import { ProductService } from '@/lib/product-service';
import { requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { productSchema } from './schema';
import { ActionResult } from '@/lib/action-result';
import { Product } from '@prisma/client';

export async function createProductAction(data: unknown): Promise<ActionResult<Product>> {
  await requirePermission('PRODUCT.CREATE');

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid product data' };
  }

  const result = await ProductService.createProduct(parsed.data);
  
  if (result.success) {
    revalidatePath('/dashboard/products');
  }

  return result;
}

export async function updateProductAction(id: string, data: unknown): Promise<ActionResult<Product>> {
  await requirePermission('PRODUCT.EDIT');

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid product data' };
  }

  const result = await ProductService.updateProduct(id, parsed.data);
  
  if (result.success) {
    revalidatePath('/dashboard/products');
    revalidatePath(`/dashboard/products/${id}`);
  }

  return result;
}

export async function adjustStockAction(productId: string, quantity: number, notes?: string) {
  await requirePermission('PRODUCT.EDIT');
  
  if (quantity === 0) {
    return { success: false, error: 'Quantity must not be zero' };
  }

  const result = await ProductService.adjustStock(productId, quantity, notes);
  
  if (result.success) {
    revalidatePath('/dashboard/products');
    revalidatePath(`/dashboard/products/${productId}`);
  }

  return result;
}
