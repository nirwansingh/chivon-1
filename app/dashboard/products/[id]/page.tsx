import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ProductService } from '@/lib/product-service';
import { Button } from '@/components/ui/button';
import { Edit, PackagePlus } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { DateDisplay } from '@/components/date-display';
import { MoneyDisplay } from '@/components/money-display';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/empty-state';
import { FolderOpen } from 'lucide-react';
import { StockAdjustmentDialog } from './stock-adjustment-dialog';
import { StockMovementList } from './stock-movement-list';

export const metadata: Metadata = {
  title: 'Product Details | Chivon CRM',
};

export default async function ProductDetailsPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('PRODUCT.VIEW');
  const canEdit = await requirePermission('PRODUCT.EDIT').then(() => true).catch(() => false);

  const { id } = await props.params;
  const [product, movements] = await Promise.all([
    ProductService.getProductById(id),
    ProductService.getStockMovements(id),
  ]);

  if (!product) {
    notFound();
  }

  const isLowStock = product.minStock && Number(product.stockQuantity) <= Number(product.minStock);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={product.name}
        description={product.sku ? `SKU: ${product.sku}` : `Product ID: ${product.id}`}
        breadcrumbs={[
          { label: 'Products & Services', href: '/dashboard/products' },
          { label: product.name }
        ]}
        action={
          canEdit ? (
            <div className="flex gap-2">
              <StockAdjustmentDialog productId={product.id} currentStock={Number(product.stockQuantity)} unit={product.unit} />
              <Button render={<Link href={`/dashboard/products/${product.id}/edit`} />} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Item
              </Button>
            </div>
          ) : undefined
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Current Stock</CardDescription>
            <CardTitle className={`text-2xl font-bold ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
              {Number(product.stockQuantity)} {product.unit}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Rate</CardDescription>
            <CardTitle className="text-2xl font-bold text-success">
              <MoneyDisplay amount={Number(product.rate)} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Type</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {product.type}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Status</CardDescription>
            <CardTitle className="text-xl font-bold">
              <StatusBadge status={product.status} />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <ScrollArea className="w-full pb-2">
          <TabsList className="mb-4 inline-flex w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stock">Stock History ({movements.length})</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="orders">Sales Orders</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Category</div>
                  <div className="font-medium">{product.category?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Unit of Measure</div>
                  <div className="font-medium">{product.unit}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">VAT Rate</div>
                  <div className="font-medium">{Number(product.vatRate)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Min Stock Level</div>
                  <div className="font-medium">{product.minStock ? Number(product.minStock) : '-'}</div>
                </div>
                <div className="md:col-span-4">
                  <div className="text-muted-foreground mb-1">Description</div>
                  <div className="font-medium bg-muted/50 p-3 rounded-md">{product.description || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium"><DateDisplay date={product.createdAt} /></div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Updated</div>
                  <div className="font-medium"><DateDisplay date={product.updatedAt} /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>Log of all stock additions, deductions, and adjustments.</CardDescription>
            </CardHeader>
            <CardContent>
              <StockMovementList movements={movements} unit={product.unit} />
            </CardContent>
          </Card>
        </TabsContent>

        {['quotations', 'orders', 'invoices'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="pt-6">
                <EmptyState 
                  icon={FolderOpen} 
                  title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} Coming Soon`} 
                  description={`This module will be built in a future phase.`} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
