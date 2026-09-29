import { PrismaClient, ProductUnit, ProductType, AddressType, UserStatus, OpportunityStatus, QuotationStatus, SalesOrderStatus, InvoiceStatus, PaymentStatus, TaskStatus, TaskPriority } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Realistic Mechanical ERP Seed ---');

  // Find users for foreign keys
  const superAdminUser = await prisma.user.findFirst({ where: { role: { name: 'Super Admin' } } }) || await prisma.user.findFirst();
  if (!superAdminUser) {
    throw new Error('No users found in database! Please run `npx prisma db seed` first to establish users and roles.');
  }

  const superAdmin = superAdminUser;
  const salesManager = (await prisma.user.findFirst({ where: { role: { name: 'Sales Manager' } } })) || superAdmin;
  const salesExec = (await prisma.user.findFirst({ where: { role: { name: 'Sales Exec' } } })) || superAdmin;
  const financeManager = (await prisma.user.findFirst({ where: { role: { name: 'Finance Manager' } } })) || superAdmin;
  const accountant = (await prisma.user.findFirst({ where: { role: { name: 'Accountant' } } })) || superAdmin;

  // 1. Product Categories
  console.log('1. Seeding Product Categories...');
  const catNames = [
    { name: 'Air Handling Units', description: 'Commercial & industrial air handlers and ventilation systems' },
    { name: 'Valves & Fluid Control', description: 'Industrial butterfly, gate, check, and control valves' },
    { name: 'Ductwork & Air Distribution', description: 'Spiral, rectangular galvanized steel ducting and dampers' },
    { name: 'Chiller & Refrigeration', description: 'Centrifugal, screw chillers, compressors and overhaul kits' },
    { name: 'MEP Maintenance Services', description: 'Preventive and breakdown maintenance service contracts' },
  ];

  const categories: Record<string, string> = {};
  for (const c of catNames) {
    const record = await prisma.productCategory.upsert({
      where: { name: c.name },
      update: { description: c.description },
      create: { name: c.name, description: c.description },
    });
    categories[c.name] = record.id;
  }

  // 2. Products (7 items)
  console.log('2. Seeding Realistic Products...');
  const productDefs = [
    {
      sku: 'HVAC-AHU-5000',
      name: 'Chilled Water Air Handling Unit (AHU) 5000 CFM',
      description: 'Double-skin thermal break construction with variable speed EC plug fans, EU7 bag filters, and copper/aluminum cooling coil.',
      rate: 18500,
      vatRate: 5,
      stockQuantity: 8,
      minStock: 2,
      unit: ProductUnit.NOS,
      type: ProductType.PRODUCT,
      category: 'Air Handling Units',
    },
    {
      sku: 'HVAC-VAV-250',
      name: 'Variable Air Volume (VAV) Terminal Box DN250',
      description: 'Pressure independent single-duct VAV unit with integrated digital BACnet actuator and acoustic lining.',
      rate: 1450,
      vatRate: 5,
      stockQuantity: 45,
      minStock: 10,
      unit: ProductUnit.NOS,
      type: ProductType.PRODUCT,
      category: 'Air Handling Units',
    },
    {
      sku: 'VLV-BF-150',
      name: 'Cast Iron Flanged Butterfly Valve DN150 PN16',
      description: 'Wafer type resilient seated butterfly valve with EPDM liner, SS316 disc, and manual gear operator.',
      rate: 680,
      vatRate: 5,
      stockQuantity: 80,
      minStock: 15,
      unit: ProductUnit.NOS,
      type: ProductType.PRODUCT,
      category: 'Valves & Fluid Control',
    },
    {
      sku: 'DCT-GS-350',
      name: 'Galvanized Spiral Steel Ducting 350mm (3m section)',
      description: 'High pressure Class C spiral wound galvanized steel ducting (0.8mm gauge) per DW144 standards.',
      rate: 210,
      vatRate: 5,
      stockQuantity: 150,
      minStock: 25,
      unit: ProductUnit.METER,
      type: ProductType.PRODUCT,
      category: 'Ductwork & Air Distribution',
    },
    {
      sku: 'CHL-KIT-250',
      name: 'Centrifugal Chiller 250 TR Major Overhaul Kit',
      description: 'Complete overhaul package including ceramic bearings, mechanical shaft seal, O-ring kit, and high-temp gaskets.',
      rate: 12800,
      vatRate: 5,
      stockQuantity: 6,
      minStock: 2,
      unit: ProductUnit.SET,
      type: ProductType.PRODUCT,
      category: 'Chiller & Refrigeration',
    },
    {
      sku: 'VLV-TXV-08',
      name: 'Electronic Thermostatic Expansion Valve (EEV) 8 Ton',
      description: 'Stepper motor driven precision expansion valve for R134a/R410A refrigeration systems with electronic driver.',
      rate: 520,
      vatRate: 5,
      stockQuantity: 60,
      minStock: 12,
      unit: ProductUnit.NOS,
      type: ProductType.PRODUCT,
      category: 'Valves & Fluid Control',
    },
    {
      sku: 'SRV-AMC-HVAC',
      name: 'Annual Preventive HVAC Maintenance Contract (AMC)',
      description: 'Comprehensive quarterly mechanical inspection, coil chemical wash, belt realignment, electrical terminal torque testing, and 24/7 breakdown callout.',
      rate: 36000,
      vatRate: 5,
      stockQuantity: 0,
      minStock: 0,
      unit: ProductUnit.NOS,
      type: ProductType.SERVICE,
      category: 'MEP Maintenance Services',
    },
  ];

  const products: any[] = [];
  for (const p of productDefs) {
    const created = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        rate: new Decimal(p.rate),
        vatRate: new Decimal(p.vatRate),
        stockQuantity: new Decimal(p.stockQuantity),
        minStock: new Decimal(p.minStock),
        unit: p.unit,
        type: p.type,
        status: UserStatus.ACTIVE,
        categoryId: categories[p.category],
      },
    });
    products.push(created);
  }

  // 3. Customers (7 authentic commercial clients)
  console.log('3. Seeding Realistic Customers...');
  const customerDefs = [
    {
      companyName: 'Al Futtaim Engineering & Technologies LLC',
      customerType: 'Corporate',
      trn: '100234567800003',
      vatNumber: '100234567800003',
      email: 'mep.procurement@alfuttaim.com',
      phone: '+971 4 213 7777',
      website: 'www.alfuttaim.com/engineering',
      industry: 'Mechanical Contracting',
      notes: 'Tier-1 MEP contractor for shopping malls and retail developments.',
      contact: {
        name: 'Tariq Al Mansoor',
        designation: 'Senior Procurement Manager',
        email: 'tariq.mansoor@alfuttaim.com',
        phone: '+971 4 213 7780',
        mobile: '+971 50 123 4567',
      },
      address: {
        type: AddressType.BILLING,
        addressLine1: 'Al Futtaim Engineering Tower, Festival City',
        city: 'Dubai',
        state: 'Dubai',
        country: 'United Arab Emirates',
        postalCode: 'PO Box 159',
      },
    },
    {
      companyName: 'Arabtec Construction LLC',
      customerType: 'Corporate',
      trn: '100345678900003',
      vatNumber: '100345678900003',
      email: 'projects@arabtec.ae',
      phone: '+971 2 644 1100',
      website: 'www.arabtec.ae',
      industry: 'General Contracting',
      notes: 'Leading infrastructure and tower development group.',
      contact: {
        name: 'Ziad Haddad',
        designation: 'Project Director',
        email: 'zhaddad@arabtec.ae',
        phone: '+971 2 644 1122',
        mobile: '+971 52 345 6789',
      },
      address: {
        type: AddressType.BILLING,
        addressLine1: 'Corniche Road, Sector E11',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        country: 'United Arab Emirates',
        postalCode: 'PO Box 3399',
      },
    },
    {
      companyName: 'Sobha Realty Developments LLC',
      customerType: 'Corporate',
      trn: '100456789000003',
      vatNumber: '100456789000003',
      email: 'mep.contracts@sobharealty.com',
      phone: '+971 4 423 3333',
      website: 'www.sobharealty.com',
      industry: 'Real Estate & MEP',
      notes: 'High-end residential master developer with in-house MEP execution.',
      contact: {
        name: 'Kavita Menon',
        designation: 'Contracts & Commercial Head',
        email: 'kavita.m@sobharealty.com',
        phone: '+971 4 423 3345',
        mobile: '+971 55 678 9012',
      },
      address: {
        type: AddressType.BILLING,
        addressLine1: 'Sobha Hartland Sales Gallery, Ras Al Khor',
        city: 'Dubai',
        state: 'Dubai',
        country: 'United Arab Emirates',
        postalCode: 'PO Box 4545',
      },
    },
    {
      companyName: 'Emaar District Cooling Services PJSC',
      customerType: 'Corporate',
      trn: '100567890100003',
      vatNumber: '100567890100003',
      email: 'operations@emaarcooling.ae',
      phone: '+971 4 367 3333',
      website: 'www.emaar.com/district-cooling',
      industry: 'District Cooling',
      notes: 'Chilled water supply utility for Downtown Dubai and Dubai Marina.',
      contact: {
        name: 'Sultan Al Qasimi',
        designation: 'District Cooling Operations Lead',
        email: 'sqasimi@emaarcooling.ae',
        phone: '+971 4 367 3350',
        mobile: '+971 50 987 6543',
      },
      address: {
        type: AddressType.BILLING,
        addressLine1: 'Downtown Boulevard, Building 4',
        city: 'Dubai',
        state: 'Dubai',
        country: 'United Arab Emirates',
        postalCode: 'PO Box 9440',
      },
    },
    {
      companyName: 'Drake & Scull Engineering LLC',
      customerType: 'Corporate',
      trn: '100678901200003',
      vatNumber: '100678901200003',
      email: 'dubai.mep@drakescull.com',
      phone: '+971 6 542 9988',
      website: 'www.drakescull.com',
      industry: 'Industrial Engineering',
      notes: 'Major industrial HVAC and water treatment MEP specialist.',
      contact: {
        name: 'Fadi Khoury',
        designation: 'Lead Mechanical Engineer',
        email: 'fkhoury@drakescull.com',
        phone: '+971 6 542 9990',
        mobile: '+971 54 456 7890',
      },
      address: {
        type: AddressType.BILLING,
        addressLine1: 'Industrial Area 12, Sharjah Logistics Zone',
        city: 'Sharjah',
        state: 'Sharjah',
        country: 'United Arab Emirates',
        postalCode: 'PO Box 6571',
      },
    },
    {
      companyName: 'Khansaheb Civil Engineering LLC',
      customerType: 'Corporate',
      trn: '100789012300003',
      vatNumber: '100789012300003',
      email: 'supplies@khansaheb.ae',
      phone: '+971 4 605 7200',
      website: 'www.khansaheb.ae',
      industry: 'Civil & Building Services',
      notes: 'Premier UAE construction and interior fit-out engineering firm.',
      contact: {
        name: 'Marcus Stewart',
        designation: 'Building Services Manager',
        email: 'marcus.s@khansaheb.ae',
        phone: '+971 4 605 7215',
        mobile: '+971 56 789 0123',
      },
      address: {
        type: AddressType.BILLING,
        addressLine1: 'Al Quoz Industrial Area 3, Latifa Bint Hamdan St',
        city: 'Dubai',
        state: 'Dubai',
        country: 'United Arab Emirates',
        postalCode: 'PO Box 2716',
      },
    },
    {
      companyName: 'Al Naboodah MEP Contracting',
      customerType: 'Corporate',
      trn: '100890123400003',
      vatNumber: '100890123400003',
      email: 'info.mep@alnaboodah.com',
      phone: '+971 4 294 8888',
      website: 'www.alnaboodah.com',
      industry: 'MEP Infrastructure',
      notes: 'Specialists in airports, transit hubs, and commercial hospitals.',
      contact: {
        name: 'Rashid Al Nuaimi',
        designation: 'Commercial Manager',
        email: 'r.nuaimi@alnaboodah.com',
        phone: '+971 4 294 8899',
        mobile: '+971 50 432 1987',
      },
      address: {
        type: AddressType.BILLING,
        addressLine1: 'Airport Road, Cargo Village Exit',
        city: 'Dubai',
        state: 'Dubai',
        country: 'United Arab Emirates',
        postalCode: 'PO Box 8988',
      },
    },
  ];

  const customers: any[] = [];
  for (const c of customerDefs) {
    const cust = await prisma.customer.create({
      data: {
        companyName: c.companyName,
        customerType: c.customerType,
        trn: c.trn,
        vatNumber: c.vatNumber,
        email: c.email,
        phone: c.phone,
        website: c.website,
        industry: c.industry,
        notes: c.notes,
        status: UserStatus.ACTIVE,
        contacts: {
          create: {
            name: c.contact.name,
            designation: c.contact.designation,
            email: c.contact.email,
            phone: c.contact.phone,
            mobile: c.contact.mobile,
            isPrimary: true,
          },
        },
        addresses: {
          create: {
            type: c.address.type,
            addressLine1: c.address.addressLine1,
            city: c.address.city,
            state: c.address.state,
            country: c.address.country,
            postalCode: c.address.postalCode,
          },
        },
      },
      include: { contacts: true },
    });
    customers.push(cust);
  }

  // 4. Opportunities (7 items in pipeline)
  console.log('4. Seeding Opportunities for Funnel Chart...');
  const oppDefs = [
    {
      name: 'Downtown Tower B - Chilled Water AHU Supply & Commissioning',
      customerIdx: 3, // Emaar
      value: 185000,
      status: OpportunityStatus.WON,
      probability: 100,
      closingDate: new Date('2026-09-10'),
    },
    {
      name: 'Sobha Hartland Phase 3 - VAV Boxes & Air Balancing Package',
      customerIdx: 2, // Sobha
      value: 92000,
      status: OpportunityStatus.NEGOTIATION,
      probability: 80,
      closingDate: new Date('2026-10-15'),
    },
    {
      name: 'Festival City Mall - Central Chiller Overhaul & Gasket Replacement',
      customerIdx: 0, // Al Futtaim
      value: 74000,
      status: OpportunityStatus.PROPOSAL,
      probability: 60,
      closingDate: new Date('2026-10-20'),
    },
    {
      name: 'Sharjah Logistics City Hub - Spiral Galvanized Ducting Supply',
      customerIdx: 4, // Drake & Scull
      value: 45000,
      status: OpportunityStatus.QUALIFIED,
      probability: 40,
      closingDate: new Date('2026-10-30'),
    },
    {
      name: 'Al Quoz Cold Storage Facility - Expansion Valves & AC Retrofit',
      customerIdx: 5, // Khansaheb
      value: 38000,
      status: OpportunityStatus.PROPOSAL,
      probability: 60,
      closingDate: new Date('2026-10-18'),
    },
    {
      name: 'Airport Terminal 2 Concourse - Heavy Duty Butterfly Valves',
      customerIdx: 6, // Al Naboodah
      value: 52000,
      status: OpportunityStatus.NEGOTIATION,
      probability: 75,
      closingDate: new Date('2026-10-12'),
    },
    {
      name: 'Corniche Commercial Center - Annual Preventive HVAC AMC',
      customerIdx: 1, // Arabtec
      value: 108000,
      status: OpportunityStatus.QUALIFIED,
      probability: 30,
      closingDate: new Date('2026-11-15'),
    },
  ];

  const opportunities: any[] = [];
  for (const o of oppDefs) {
    const opp = await prisma.opportunity.create({
      data: {
        name: o.name,
        customerId: customers[o.customerIdx].id,
        contactId: customers[o.customerIdx].contacts[0]?.id,
        expectedValue: new Decimal(o.value),
        probability: o.probability,
        status: o.status,
        expectedClosingDate: o.closingDate,
        assignedUserId: salesExec.id,
      },
    });
    opportunities.push(opp);
  }

  // 5. Quotations (7 items)
  console.log('5. Seeding Quotations...');
  const quoteDefs = [
    {
      number: 'QT-20260910-0001',
      customerIdx: 3, // Emaar
      oppIdx: 0,
      status: QuotationStatus.ACCEPTED,
      date: new Date('2026-09-10'),
      items: [
        { productIdx: 0, qty: 10, rate: 18500 }, // 185,000 + 5% = 194,250
      ],
    },
    {
      number: 'QT-20260914-0002',
      customerIdx: 2, // Sobha
      oppIdx: 1,
      status: QuotationStatus.SENT,
      date: new Date('2026-09-14'),
      items: [
        { productIdx: 1, qty: 50, rate: 1450 },  // 72,500
        { productIdx: 3, qty: 93, rate: 210 },   // 19,530 -> ~92,030 subtotal
      ],
    },
    {
      number: 'QT-20260918-0003',
      customerIdx: 0, // Al Futtaim
      oppIdx: 2,
      status: QuotationStatus.APPROVED,
      date: new Date('2026-09-18'),
      items: [
        { productIdx: 4, qty: 5, rate: 12800 },  // 64,000
        { productIdx: 5, qty: 19, rate: 520 },   // 9,880
      ],
    },
    {
      number: 'QT-20260921-0004',
      customerIdx: 4, // Drake & Scull
      oppIdx: 3,
      status: QuotationStatus.APPROVED,
      date: new Date('2026-09-21'),
      items: [
        { productIdx: 3, qty: 214, rate: 210 },  // 44,940
      ],
    },
    {
      number: 'QT-20260924-0005',
      customerIdx: 5, // Khansaheb
      oppIdx: 4,
      status: QuotationStatus.SENT,
      date: new Date('2026-09-24'),
      items: [
        { productIdx: 2, qty: 40, rate: 680 },   // 27,200
        { productIdx: 5, qty: 21, rate: 520 },   // 10,920
      ],
    },
    {
      number: 'QT-20260927-0006',
      customerIdx: 6, // Al Naboodah
      oppIdx: 5,
      status: QuotationStatus.APPROVED,
      date: new Date('2026-09-27'),
      items: [
        { productIdx: 2, qty: 75, rate: 680 },   // 51,000
      ],
    },
    {
      number: 'QT-20260929-0007',
      customerIdx: 1, // Arabtec
      oppIdx: 6,
      status: QuotationStatus.DRAFT,
      date: new Date('2026-09-29'),
      items: [
        { productIdx: 6, qty: 3, rate: 36000 },  // 108,000
      ],
    },
  ];

  const quotations: any[] = [];
  for (const q of quoteDefs) {
    let subtotal = new Decimal(0);
    const lineItemsData = q.items.map((it) => {
      const prod = products[it.productIdx];
      const qty = new Decimal(it.qty);
      const rate = new Decimal(it.rate);
      const lineSub = qty.mul(rate);
      const vatRate = new Decimal(5.0);
      const vatAmount = lineSub.mul(vatRate).div(100);
      const lineTotal = lineSub.add(vatAmount);
      subtotal = subtotal.add(lineSub);
      return {
        productId: prod.id,
        description: prod.name,
        quantity: qty,
        unit: prod.unit,
        rate: rate,
        vatRate: vatRate,
        vatAmount: vatAmount,
        lineSubtotal: lineSub,
        lineTotal: lineTotal,
      };
    });

    const vatAmount = subtotal.mul(0.05);
    const grandTotal = subtotal.add(vatAmount);

    const created = await prisma.quotation.create({
      data: {
        number: q.number,
        customerId: customers[q.customerIdx].id,
        contactId: customers[q.customerIdx].contacts[0]?.id,
        opportunityId: opportunities[q.oppIdx].id,
        status: q.status,
        date: q.date,
        createdById: salesExec.id,
        notes: 'Price includes delivery to site inside UAE. 30 days payment terms upon delivery.',
        terms: 'Subject to standard Chivon Mechanical LLC delivery terms and manufacturer warranty.',
        revisions: {
          create: {
            revisionNumber: 1,
            isCurrent: true,
            subtotal: subtotal,
            taxableAmount: subtotal,
            vatAmount: vatAmount,
            grandTotal: grandTotal,
            items: {
              create: lineItemsData,
            },
          },
        },
      },
      include: { revisions: { include: { items: true } } },
    });
    quotations.push(created);
  }

  // 6. Sales Orders (6 orders)
  console.log('6. Seeding Sales Orders...');
  const soDefs = [
    {
      number: 'SO-20260911-0001',
      customerIdx: 3, // Emaar
      quoteIdx: 0,
      status: SalesOrderStatus.IN_PROGRESS,
      date: new Date('2026-09-11'),
    },
    {
      number: 'SO-20260916-0002',
      customerIdx: 2, // Sobha
      quoteIdx: 1,
      status: SalesOrderStatus.CONFIRMED,
      date: new Date('2026-09-16'),
    },
    {
      number: 'SO-20260920-0003',
      customerIdx: 0, // Al Futtaim
      quoteIdx: 2,
      status: SalesOrderStatus.CONFIRMED,
      date: new Date('2026-09-20'),
    },
    {
      number: 'SO-20260922-0004',
      customerIdx: 4, // Drake & Scull
      quoteIdx: 3,
      status: SalesOrderStatus.PARTIALLY_FULFILLED,
      date: new Date('2026-09-22'),
    },
    {
      number: 'SO-20260925-0005',
      customerIdx: 5, // Khansaheb
      quoteIdx: 4,
      status: SalesOrderStatus.CONFIRMED,
      date: new Date('2026-09-25'),
    },
    {
      number: 'SO-20260928-0006',
      customerIdx: 6, // Al Naboodah
      quoteIdx: 5,
      status: SalesOrderStatus.CONFIRMED,
      date: new Date('2026-09-28'),
    },
  ];

  const salesOrders: any[] = [];
  for (const s of soDefs) {
    const quote = quotations[s.quoteIdx];
    const rev = quote.revisions[0];
    const orderItems = rev.items.map((it: any) => ({
      productId: it.productId,
      description: it.description,
      orderedQty: it.quantity,
      remainingQty: it.quantity,
      unit: it.unit,
      rate: it.rate,
      vatRate: it.vatRate,
      vatAmount: it.vatAmount,
      lineSubtotal: it.lineSubtotal,
      lineTotal: it.lineTotal,
    }));

    const so = await prisma.salesOrder.create({
      data: {
        number: s.number,
        customerId: customers[s.customerIdx].id,
        quotationId: quote.id,
        quotationRevisionId: rev.id,
        status: s.status,
        date: s.date,
        subtotal: rev.subtotal,
        taxableAmount: rev.taxableAmount,
        vatAmount: rev.vatAmount,
        grandTotal: rev.grandTotal,
        createdById: salesManager.id,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });
    salesOrders.push(so);
  }

  // 7. Invoices (7 invoices spanning June, July, August, September for monthly trendline)
  console.log('7. Seeding Invoices (Past & Current Months for Multi-Month Chart)...');
  const invDefs = [
    {
      number: 'INV-20260615-0001',
      customerIdx: 0, // Al Futtaim
      date: new Date('2026-06-15'),
      dueDate: new Date('2026-07-15'),
      status: InvoiceStatus.PAID,
      items: [
        { productIdx: 2, qty: 70, rate: 680 }, // 47,600 + 5% = 49,980
      ],
    },
    {
      number: 'INV-20260718-0002',
      customerIdx: 5, // Khansaheb
      date: new Date('2026-07-18'),
      dueDate: new Date('2026-08-18'),
      status: InvoiceStatus.PAID,
      items: [
        { productIdx: 1, qty: 55, rate: 1450 }, // 79,750 + 5% = 83,737.50
      ],
    },
    {
      number: 'INV-20260812-0003',
      customerIdx: 1, // Arabtec
      date: new Date('2026-08-12'),
      dueDate: new Date('2026-09-12'), // Overdue!
      status: InvoiceStatus.PARTIALLY_PAID,
      items: [
        { productIdx: 6, qty: 3, rate: 36000 }, // 108,000 + 5% = 113,400
      ],
    },
    {
      number: 'INV-20260905-0004',
      customerIdx: 3, // Emaar
      soIdx: 0,
      date: new Date('2026-09-05'),
      dueDate: new Date('2026-10-05'),
      status: InvoiceStatus.PARTIALLY_PAID,
      items: [
        { productIdx: 0, qty: 10, rate: 18500 }, // 185,000 + 5% = 194,250
      ],
    },
    {
      number: 'INV-20260912-0005',
      customerIdx: 2, // Sobha
      soIdx: 1,
      date: new Date('2026-09-12'),
      dueDate: new Date('2026-10-12'),
      status: InvoiceStatus.ISSUED,
      items: [
        { productIdx: 1, qty: 50, rate: 1450 }, // 72,500 + 5% = 76,125
      ],
    },
    {
      number: 'INV-20260919-0006',
      customerIdx: 4, // Drake & Scull
      soIdx: 3,
      date: new Date('2026-09-19'),
      dueDate: new Date('2026-09-25'), // Past due date!
      status: InvoiceStatus.ISSUED,
      items: [
        { productIdx: 3, qty: 214, rate: 210 }, // 44,940 + 5% = 47,187
      ],
    },
    {
      number: 'INV-20260926-0007',
      customerIdx: 6, // Al Naboodah
      soIdx: 5,
      date: new Date('2026-09-26'),
      dueDate: new Date('2026-10-26'),
      status: InvoiceStatus.ISSUED,
      items: [
        { productIdx: 2, qty: 75, rate: 680 }, // 51,000 + 5% = 53,550
      ],
    },
  ];

  const invoices: any[] = [];
  for (const inv of invDefs) {
    let subtotal = new Decimal(0);
    const invoiceItemsData = inv.items.map((it) => {
      const prod = products[it.productIdx];
      const qty = new Decimal(it.qty);
      const rate = new Decimal(it.rate);
      const lineSub = qty.mul(rate);
      const vatRate = new Decimal(5.0);
      const vatAmount = lineSub.mul(vatRate).div(100);
      const lineTotal = lineSub.add(vatAmount);
      subtotal = subtotal.add(lineSub);
      return {
        productId: prod.id,
        description: prod.name,
        quantity: qty,
        unit: prod.unit,
        rate: rate,
        vatRate: vatRate,
        vatAmount: vatAmount,
        lineSubtotal: lineSub,
        lineTotal: lineTotal,
      };
    });

    const vatAmount = subtotal.mul(0.05);
    const grandTotal = subtotal.add(vatAmount);

    const created = await prisma.invoice.create({
      data: {
        number: inv.number,
        customerId: customers[inv.customerIdx].id,
        salesOrderId: inv.soIdx !== undefined ? salesOrders[inv.soIdx]?.id : undefined,
        status: inv.status,
        date: inv.date,
        dueDate: inv.dueDate,
        paymentTerms: 'Net 30 Days',
        subtotal: subtotal,
        taxableAmount: subtotal,
        vatAmount: vatAmount,
        grandTotal: grandTotal,
        createdById: accountant.id,
        items: {
          create: invoiceItemsData,
        },
      },
    });
    invoices.push(created);
  }

  // 8. Payments (5 realistic receipts with allocations)
  console.log('8. Seeding Payments & Allocations...');
  const payDefs = [
    {
      number: 'RCP-20260620-0001',
      customerIdx: 0, // Al Futtaim
      amount: 49980, // Paid INV 1 in full
      date: new Date('2026-06-20'),
      method: 'Bank Transfer',
      bank: 'Emirates NBD',
      ref: 'FT-ENBD-883190',
      allocations: [
        { invIdx: 0, amount: 49980 },
      ],
      status: PaymentStatus.FULLY_ALLOCATED,
    },
    {
      number: 'RCP-20260725-0002',
      customerIdx: 5, // Khansaheb
      amount: 83737.50, // Paid INV 2 in full
      date: new Date('2026-07-25'),
      method: 'Bank Transfer',
      bank: 'First Abu Dhabi Bank (FAB)',
      ref: 'TT-FAB-442109',
      allocations: [
        { invIdx: 1, amount: 83737.50 },
      ],
      status: PaymentStatus.FULLY_ALLOCATED,
    },
    {
      number: 'RCP-20260828-0003',
      customerIdx: 1, // Arabtec
      amount: 60000, // Partial payment on INV 3
      date: new Date('2026-08-28'),
      method: 'Cheque',
      bank: 'Abu Dhabi Commercial Bank (ADCB)',
      chequeNumber: 'CHQ-899120',
      ref: 'CHQ-899120',
      allocations: [
        { invIdx: 2, amount: 60000 },
      ],
      status: PaymentStatus.FULLY_ALLOCATED,
    },
    {
      number: 'RCP-20260915-0004',
      customerIdx: 3, // Emaar
      amount: 100000, // 50% mobilization milestone on INV 4
      date: new Date('2026-09-15'),
      method: 'Bank Transfer',
      bank: 'Dubai Islamic Bank (DIB)',
      ref: 'DIB-WIRE-20260915-11',
      allocations: [
        { invIdx: 3, amount: 100000 },
      ],
      status: PaymentStatus.FULLY_ALLOCATED,
    },
    {
      number: 'RCP-20260924-0005',
      customerIdx: 2, // Sobha
      amount: 35000, // Unallocated on-account payment
      date: new Date('2026-09-24'),
      method: 'Bank Transfer',
      bank: 'Mashreq Bank',
      ref: 'MSH-ONACC-7721',
      allocations: [],
      status: PaymentStatus.UNALLOCATED,
    },
  ];

  for (const p of payDefs) {
    const payment = await prisma.payment.create({
      data: {
        number: p.number,
        customerId: customers[p.customerIdx].id,
        amount: new Decimal(p.amount),
        paymentDate: p.date,
        paymentMethod: p.method,
        bank: p.bank,
        referenceNumber: p.ref,
        chequeNumber: p.chequeNumber,
        status: p.status,
        createdById: financeManager.id,
      },
    });

    for (const alloc of p.allocations) {
      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoices[alloc.invIdx].id,
          amount: new Decimal(alloc.amount),
        },
      });
    }
  }

  // 9. Tasks (5 actionable upcoming tasks for dashboard)
  console.log('9. Seeding Upcoming Tasks...');
  const taskDefs = [
    {
      title: 'Site commissioning inspection of AHU units at Downtown Tower B',
      description: 'Coordinate with Emaar MEP inspector and verify static pressure readings on duct run.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2026-10-02T10:00:00Z'),
      customerIdx: 3,
      assignedUserId: salesExec.id,
    },
    {
      title: 'Deliver stamped warranty certificates to Sobha Hartland site office',
      description: 'Provide 5-year coil and motor manufacturer warranty dossiers to Kavita Menon.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2026-10-04T14:00:00Z'),
      customerIdx: 2,
      assignedUserId: salesExec.id,
    },
    {
      title: 'Urgent follow-up on overdue invoice INV-20260919-0006 with Drake & Scull',
      description: 'Overdue balance of AED 47,187 past due date. Verify payment voucher clearance.',
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      dueDate: new Date('2026-09-30T09:00:00Z'),
      customerIdx: 4,
      assignedUserId: accountant.id,
    },
    {
      title: 'Conduct chiller vibration analysis test at Festival City Mall',
      description: 'Baseline acoustic and bearing temperature test on 250 TR compressor head.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2026-10-08T11:00:00Z'),
      customerIdx: 0,
      assignedUserId: salesManager.id,
    },
    {
      title: 'Review proposal draft for Arabtec Corniche Center AMC renewal',
      description: 'Finalize quarterly maintenance scope and submit revised quotation QT-20260929-0007.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: new Date('2026-10-05T16:00:00Z'),
      customerIdx: 1,
      assignedUserId: salesManager.id,
    },
  ];

  for (const t of taskDefs) {
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        customerId: customers[t.customerIdx].id,
        assignedToId: t.assignedUserId,
        createdById: superAdmin.id,
      },
    });
  }

  console.log('--- Realistic Mechanical ERP Seed Finished Successfully! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
