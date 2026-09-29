import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS, PERMISSIONS } from '../lib/permissions';
import { DocumentNumberService } from '../lib/sequence';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Settings Defaults
  console.log('Seeding settings...');
  await prisma.companySetting.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', companyName: 'Chivon Mechanical Demo' },
  });
  await prisma.documentSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  // 2. Permissions
  console.log('Seeding permissions...');
  for (const perm of ALL_PERMISSIONS) {
    const [module, action] = perm.split(':');
    await prisma.permission.upsert({
      where: { key: perm },
      update: {},
      create: { key: perm, module: module.toUpperCase(), action: action.toUpperCase(), description: `Can ${action} ${module}` },
    });
  }

  // 3. Roles
  console.log('Seeding roles...');
  const roleDefinitions = [
    { name: 'Super Admin', isSystem: true, perms: ALL_PERMISSIONS },
    { name: 'Sales Manager', isSystem: true, perms: [PERMISSIONS.CRM.READ, PERMISSIONS.CRM.CREATE, PERMISSIONS.CRM.UPDATE, PERMISSIONS.SALES.READ, PERMISSIONS.SALES.CREATE, PERMISSIONS.SALES.UPDATE, PERMISSIONS.SALES.APPROVE] },
    { name: 'Sales Exec', isSystem: true, perms: [PERMISSIONS.CRM.READ, PERMISSIONS.CRM.CREATE, PERMISSIONS.CRM.UPDATE, PERMISSIONS.SALES.READ, PERMISSIONS.SALES.CREATE, PERMISSIONS.SALES.UPDATE] },
    { name: 'Finance Manager', isSystem: true, perms: [PERMISSIONS.FINANCE.READ, PERMISSIONS.FINANCE.CREATE, PERMISSIONS.FINANCE.UPDATE, PERMISSIONS.FINANCE.APPROVE, PERMISSIONS.FINANCE.REVERSE] },
    { name: 'Accountant', isSystem: true, perms: [PERMISSIONS.FINANCE.READ, PERMISSIONS.FINANCE.CREATE, PERMISSIONS.FINANCE.UPDATE] },
    { name: 'Procurement', isSystem: true, perms: [PERMISSIONS.SETTINGS.READ] },
    { name: 'Viewer', isSystem: true, perms: [PERMISSIONS.CRM.READ, PERMISSIONS.SALES.READ, PERMISSIONS.FINANCE.READ] },
  ];

  for (const roleDef of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { isSystem: roleDef.isSystem },
      create: { name: roleDef.name, isSystem: roleDef.isSystem },
    });

    const currentPerms = await prisma.rolePermission.findMany({ where: { roleId: role.id } });
    if (currentPerms.length === 0) {
      for (const perm of roleDef.perms) {
        const p = await prisma.permission.findUnique({ where: { key: perm } });
        if (p) {
          await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: p.id } });
        }
      }
    }
  }

  // 4. Demo Users
  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  const usersToCreate = roleDefinitions.map(r => ({
    name: `${r.name} User`,
    email: `${r.name.toLowerCase().replace(' ', '.')}@chivon.local`,
    roleName: r.name,
  }));

  const createdUsers = [];
  for (const u of usersToCreate) {
    const role = await prisma.role.findUnique({ where: { name: u.roleName } });
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, roleId: role!.id },
    });
    createdUsers.push(user);
  }

  // Generate Dummy Data (Only if empty to remain idempotent)
  const customerCount = await prisma.customer.count();
  if (customerCount === 0) {
    console.log('Generating dummy data...');
    // 5. Products
    const products = [];
    for (let i = 1; i <= 1; i++) {
      products.push(await prisma.product.create({
        data: {
          sku: `SKU-${1000 + i}`,
          name: `Industrial Pump Model ${String.fromCharCode(64 + i)}`,
          rate: 100 * i,
          stockQuantity: 50,
          description: `A highly efficient industrial pump.`
        }
      }));
    }

    // 6. Customers
    const customers = [];
    for (let i = 1; i <= 1; i++) {
      customers.push(await prisma.customer.create({
        data: {
          companyName: `Demo Corp ${i} LLC`,
          email: `contact@democorp${i}.com`,
          contacts: {
            create: { name: `John Doe ${i}`, isPrimary: true, email: `john@democorp${i}.com` }
          }
        }
      }));
    }

    const adminUser = createdUsers[0];

    // 7. Opportunities
    const opportunities = [];
    for (let i = 0; i < 1; i++) {
      opportunities.push(await prisma.opportunity.create({
        data: {
          name: `Pipeline Upgrade Phase ${i+1}`,
          customerId: customers[i % 10].id,
          expectedValue: 5000 + i * 1000,
          status: i % 2 === 0 ? 'NEW' : 'PROPOSAL',
          assignedUserId: adminUser.id,
        }
      }));
    }

    // 8. Quotes
    const quotes = [];
    for (let i = 0; i < 1; i++) {
      const qNum = await DocumentNumberService.generateNextNumber('QT');
      const quote = await prisma.quotation.create({
        data: {
          number: qNum,
          customerId: customers[i % 10].id,
          opportunityId: i < 10 ? opportunities[i].id : undefined,
          status: 'APPROVED',
          createdById: adminUser.id,
          revisions: {
            create: {
              revisionNumber: 1,
              isCurrent: true,
              subtotal: 0, taxableAmount: 0, vatAmount: 0, grandTotal: 0,
              items: {
                create: [
                  { productId: products[i].id, quantity: 2, rate: products[i].rate, vatRate: 5, vatAmount: Number(products[i].rate) * 2 * 0.05, lineSubtotal: Number(products[i].rate) * 2, lineTotal: Number(products[i].rate) * 2 * 1.05 }
                ]
              }
            }
          }
        }
      });
      const sub = Number(products[i].rate) * 2;
      const vat = sub * 0.05;
      await prisma.quotationRevision.updateMany({
        where: { quotationId: quote.id },
        data: { subtotal: sub, taxableAmount: sub, vatAmount: vat, grandTotal: sub + vat }
      });
      
      const qWithRevs = await prisma.quotation.findUnique({ where: { id: quote.id }, include: { revisions: true } });
      quotes.push(qWithRevs!);
    }

    // 9. Sales Orders
    const salesOrders = [];
    for (let i = 0; i < 1; i++) {
      const soNum = await DocumentNumberService.generateNextNumber('SO');
      const so = await prisma.salesOrder.create({
        data: {
          number: soNum,
          customerId: customers[i].id,
          quotationId: quotes[i].id,
          quotationRevisionId: quotes[i].revisions[0].id,
          status: 'CONFIRMED',
          createdById: adminUser.id,
          subtotal: 0, taxableAmount: 0, vatAmount: 0, grandTotal: 0,
          items: {
            create: [
              { productId: products[i].id, orderedQty: 2, remainingQty: 2, rate: products[i].rate, vatRate: 5, vatAmount: Number(products[i].rate) * 2 * 0.05, lineSubtotal: Number(products[i].rate) * 2, lineTotal: Number(products[i].rate) * 2 * 1.05 }
            ]
          }
        }
      });
      const sub = Number(products[i].rate) * 2;
      const vat = sub * 0.05;
      await prisma.salesOrder.update({
        where: { id: so.id },
        data: { subtotal: sub, taxableAmount: sub, vatAmount: vat, grandTotal: sub + vat }
      });
      salesOrders.push(so);
    }

    // 10. Invoices
    const invoices = [];
    for (let i = 0; i < 1; i++) {
      const invNum = await DocumentNumberService.generateNextNumber('INV');
      const invoice = await prisma.invoice.create({
        data: {
          number: invNum,
          customerId: customers[i % 10].id,
          salesOrderId: i < 10 ? salesOrders[i].id : undefined,
          status: i % 2 === 0 ? 'ISSUED' : 'PAID',
          createdById: adminUser.id,
          subtotal: 0, taxableAmount: 0, vatAmount: 0, grandTotal: 0,
          items: {
            create: [
              { productId: products[i].id, quantity: 2, rate: products[i].rate, vatRate: 5, vatAmount: Number(products[i].rate) * 2 * 0.05, lineSubtotal: Number(products[i].rate) * 2, lineTotal: Number(products[i].rate) * 2 * 1.05 }
            ]
          }
        }
      });
      const sub = Number(products[i].rate) * 2;
      const vat = sub * 0.05;
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { subtotal: sub, taxableAmount: sub, vatAmount: vat, grandTotal: sub + vat }
      });
      invoices.push(invoice);
    }

    // 11. Payments
    for (let i = 0; i < 1; i++) {
      const payNum = await DocumentNumberService.generateNextNumber('PAY');
      
      const inv = await prisma.invoice.findUnique({ where: { id: invoices[i].id } });
      
      await prisma.payment.create({
        data: {
          number: payNum,
          customerId: inv!.customerId,
          amount: inv!.grandTotal,
          paymentMethod: 'BANK_TRANSFER',
          status: 'FULLY_ALLOCATED',
          createdById: adminUser.id,
          allocations: {
            create: {
              invoiceId: inv!.id,
              amount: inv!.grandTotal
            }
          }
        }
      });
    }

    console.log('Dummy data generated successfully.');
  } else {
    console.log('Dummy data already exists, skipping generation.');
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
