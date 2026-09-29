import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ProductForm } from '@/components/product-form';
import { ProductService } from '@/lib/product-service';

export const metadata: Metadata = {
  title: 'Edit Item | Chivon CRM',
};

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('PRODUCT.EDIT');

  const { id } = await props.params;
  const [product, categories] = await Promise.all([
    ProductService.getProductById(id),
    ProductService.getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={`Edit ${product.name}`} 
        description="Update product or service information."
        breadcrumbs={[
          { label: 'Products & Services', href: '/dashboard/products' },
          { label: product.name, href: `/dashboard/products/${product.id}` },
          { label: 'Edit' }
        ]}
      />
      
      <div className="max-w-4xl">
        <ProductForm 
          initialData={{
            ...product,
            rate: Number(product.rate),
            vatRate: Number(product.vatRate),
            stockQuantity: product.stockQuantity ? Number(product.stockQuantity) : null,
            minStock: product.minStock ? Number(product.minStock) : null,
          } as any} 
          categories={categories} 
        />
      </div>
    </div>
  );
}
