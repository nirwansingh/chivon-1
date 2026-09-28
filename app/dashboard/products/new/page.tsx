import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ProductForm } from '@/components/product-form';
import { ProductService } from '@/lib/product-service';

export const metadata: Metadata = {
  title: 'Add New Product/Service | Chivon CRM',
};

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('PRODUCT.CREATE');

  const categories = await ProductService.getCategories();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Add New Item" 
        description="Create a new product, service, or manpower entry."
        breadcrumbs={[
          { label: 'Products & Services', href: '/dashboard/products' },
          { label: 'New' }
        ]}
      />
      
      <div className="max-w-4xl">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
