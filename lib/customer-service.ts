import { prisma } from '@/lib/prisma';
import { Customer, CustomerContact, CustomerAddress, Prisma } from '@prisma/client';
import { AuditService } from '@/lib/audit';

export type CustomerWithRelations = Prisma.CustomerGetPayload<{
  include: {
    contacts: true;
    addresses: true;
  };
}>;

export class CustomerService {
  /**
   * Get customers with pagination, sorting, and filtering
   */
  static async getCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { companyName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { trn: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data,
      total,
      pageCount: Math.ceil(total / limit),
    };
  }

  /**
   * Get single customer by ID
   */
  static async getCustomerById(id: string): Promise<CustomerWithRelations | null> {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { isPrimary: 'desc' } },
        addresses: { orderBy: { type: 'asc' } },
      },
    });
  }

  /**
   * Create new customer
   */
  static async createCustomer(
    userId: string,
    data: Prisma.CustomerCreateInput,
    contacts?: Prisma.CustomerContactCreateWithoutCustomerInput[],
    addresses?: Prisma.CustomerAddressCreateWithoutCustomerInput[]
  ) {
    const customer = await prisma.customer.create({
      data: {
        ...data,
        contacts: contacts ? { create: contacts } : undefined,
        addresses: addresses ? { create: addresses } : undefined,
      },
      include: {
        contacts: true,
        addresses: true,
      },
    });

    await AuditService.log({
      userId,
      action: 'CREATE',
      module: 'CUSTOMER',
      entityType: 'Customer',
      entityId: customer.id,
      description: `Created customer ${customer.companyName}`,
      afterData: customer,
    });

    return customer;
  }

  /**
   * Update existing customer, including nested contacts and addresses.
   */
  static async fullUpdateCustomer(
    userId: string,
    id: string,
    data: Prisma.CustomerUpdateInput,
    contacts: { id?: string; name: string; designation?: string; email?: string; phone?: string; mobile?: string; whatsapp?: string; isPrimary: boolean; notes?: string }[],
    addresses: { id?: string; type: any; addressLine1: string; addressLine2?: string; city: string; state?: string; country: string; postalCode?: string }[]
  ) {
    const beforeData = await prisma.customer.findUnique({ where: { id }, include: { contacts: true, addresses: true } });
    if (!beforeData) throw new Error('Customer not found');

    const contactIdsToKeep = contacts.filter(c => c.id).map(c => c.id as string);
    const addressIdsToKeep = addresses.filter(a => a.id).map(a => a.id as string);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        contacts: {
          deleteMany: { id: { notIn: contactIdsToKeep } },
          upsert: contacts.map(c => ({
            where: { id: c.id || 'new_temp_id' },
            update: {
              name: c.name,
              designation: c.designation,
              email: c.email,
              phone: c.phone,
              mobile: c.mobile,
              whatsapp: c.whatsapp,
              isPrimary: c.isPrimary,
              notes: c.notes,
            },
            create: {
              name: c.name,
              designation: c.designation,
              email: c.email,
              phone: c.phone,
              mobile: c.mobile,
              whatsapp: c.whatsapp,
              isPrimary: c.isPrimary,
              notes: c.notes,
            }
          })),
        },
        addresses: {
          deleteMany: { id: { notIn: addressIdsToKeep } },
          upsert: addresses.map(a => ({
            where: { id: a.id || 'new_temp_id' },
            update: {
              type: a.type,
              addressLine1: a.addressLine1,
              addressLine2: a.addressLine2,
              city: a.city,
              state: a.state,
              country: a.country,
              postalCode: a.postalCode,
            },
            create: {
              type: a.type,
              addressLine1: a.addressLine1,
              addressLine2: a.addressLine2,
              city: a.city,
              state: a.state,
              country: a.country,
              postalCode: a.postalCode,
            }
          })),
        }
      },
      include: {
        contacts: true,
        addresses: true,
      }
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      module: 'CUSTOMER',
      entityType: 'Customer',
      entityId: customer.id,
      description: `Updated customer ${customer.companyName}`,
      beforeData,
      afterData: customer,
    });

    return customer;
  }

  /**
   * Soft-delete customer if allowed
   */
  static async deleteCustomer(userId: string, id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quotations: true,
            salesOrders: true,
            invoices: true,
            payments: true,
          }
        }
      }
    });

    if (!customer) throw new Error('Customer not found');

    // Dependency check (T-11 / P4.8)
    const totalTransactions = 
      customer._count.quotations + 
      customer._count.salesOrders + 
      customer._count.invoices + 
      customer._count.payments;

    if (totalTransactions > 0) {
      throw new Error('Customer cannot be deleted because transactional records exist.');
    }

    await prisma.customer.delete({ where: { id } });

    await AuditService.log({
      userId,
      action: 'DELETE',
      module: 'CUSTOMER',
      entityType: 'Customer',
      entityId: id,
      description: `Deleted customer ${customer.companyName}`,
      beforeData: customer,
    });

    return true;
  }
}
