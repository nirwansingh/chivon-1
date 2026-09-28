import { prisma } from './prisma';
import { ActionResult } from './action-result';
import { Product, ProductCategory, Prisma } from '@prisma/client';
import { AuditService } from './audit';
import { getCurrentUser } from './auth';

export type ProductWithCategory = Product & {
  category: ProductCategory | null;
};

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
  static async getProducts(
    options: GetProductsOptions = {}
  ): Promise<{ data: ProductWithCategory[]; total: number; pageCount: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      categoryId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(type ? { type: type as any } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status: status as any } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      total,
      pageCount: Math.ceil(total / limit),
    };
  }

  static async getCategories(): Promise<ProductCategory[]> {
    return prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async getProductById(id: string): Promise<ProductWithCategory | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  static async createProduct(data: any): Promise<ActionResult<Product>> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const product = await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            sku: data.sku || null,
            name: data.name,
            type: data.type,
            categoryId: data.categoryId || null,
            description: data.description,
            unit: data.unit,
            rate: data.rate,
            vatRate: data.vatRate,
            minStock: data.minStock,
            status: data.status,
            stockQuantity: data.initialStock || 0,
          },
        });

        if (data.initialStock && data.initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              productId: created.id,
              type: 'OPENING',
              quantity: data.initialStock,
              reference: 'Initial Stock',
              createdById: user.id,
            },
          });
        }

        return created;
      });

      await AuditService.log({
        userId: user.id,
        action: 'CREATE',
        module: 'PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        afterData: product,
      });

      return { success: true, data: product };
    } catch (error: any) {
      if (error.code === 'P2002') {
        return { success: false, error: 'SKU already exists' };
      }
      console.error('Create product error:', error);
      return { success: false, error: 'Failed to create product' };
    }
  }

  static async updateProduct(id: string, data: any): Promise<ActionResult<Product>> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const before = await prisma.product.findUnique({ where: { id } });
      if (!before) return { success: false, error: 'Product not found' };

      const product = await prisma.product.update({
        where: { id },
        data: {
          sku: data.sku || null,
          name: data.name,
          type: data.type,
          categoryId: data.categoryId || null,
          description: data.description,
          unit: data.unit,
          rate: data.rate,
          vatRate: data.vatRate,
          minStock: data.minStock,
          status: data.status,
        },
      });

      await AuditService.log({
        userId: user.id,
        action: 'UPDATE',
        module: 'PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        beforeData: before,
        afterData: product,
      });

      return { success: true, data: product };
    } catch (error: any) {
      if (error.code === 'P2002') {
        return { success: false, error: 'SKU already exists' };
      }
      console.error('Update product error:', error);
      return { success: false, error: 'Failed to update product' };
    }
  }

  static async adjustStock(productId: string, quantity: number, notes?: string): Promise<ActionResult<Product>> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const product = await prisma.$transaction(async (tx) => {
        const p = await tx.product.findUnique({ where: { id: productId } });
        if (!p) throw new Error('Product not found');

        const movement = await tx.stockMovement.create({
          data: {
            productId,
            type: 'ADJUSTMENT',
            quantity,
            notes,
            createdById: user.id,
          },
        });

        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: {
              increment: quantity,
            },
          },
        });

        return updatedProduct;
      });

      await AuditService.log({
        userId: user.id,
        action: 'ADJUST_STOCK',
        module: 'PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        afterData: { adjustment: quantity, newStock: product.stockQuantity },
      });

      return { success: true, data: product };
    } catch (error: any) {
      console.error('Adjust stock error:', error);
      return { success: false, error: error.message || 'Failed to adjust stock' };
    }
  }

  static async getStockMovements(productId: string) {
    return prisma.stockMovement.findMany({
      where: { productId },
      include: {
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
