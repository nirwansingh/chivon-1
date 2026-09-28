import { Metadata } from 'next';
import { ProductService } from '@/lib/product-service';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProductListClient } from './client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Products & Services | Chivon CRM',
};

export default async function ProductsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('PRODUCT.VIEW');
  const canCreate = await requirePermission('PRODUCT.CREATE').then(() => true).catch(() => false);

  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 10;
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const type = typeof searchParams.type === 'string' ? searchParams.type : undefined;
  const categoryId = typeof searchParams.categoryId === 'string' ? searchParams.categoryId : undefined;
  
  const status = typeof searchParams.status === 'string' && (searchParams.status === 'ACTIVE' || searchParams.status === 'INACTIVE') 
    ? searchParams.status 
    : undefined;
  const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : 'createdAt';
  const sortOrder = searchParams.sortOrder === 'asc' ? 'asc' : 'desc';

  const [productsData, categories] = await Promise.all([
    ProductService.getProducts({
      page,
      limit,
      search,
      type,
      categoryId,
      status,
      sortBy,
      sortOrder,
    }),
    ProductService.getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Products & Services" 
        description="Manage your catalog, services, manpower, and stock."
        action={
          canCreate ? (
            <Button render={
              <Link href="/dashboard/products/new" />
            }>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          ) : undefined
        }
      />
      
      <ProductListClient 
        initialData={productsData.data} 
        initialTotal={productsData.total}
        initialPageCount={productsData.pageCount}
        categories={categories}
      />
    </div>
  );
}
