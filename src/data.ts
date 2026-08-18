import { UserRole, Employee, Product, Transaction, Buyback, Supplier } from "./types";

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP001",
    tenantId: "tenant_demo_1",
    username: "admin",
    name: "Ricky Commedan",
    role: UserRole.ADMIN,
    passwordHash: "Admin#2026!",
    email: "rickycommedan@gmail.com",
    isActive: true,
  },
  {
    id: "EMP002",
    tenantId: "tenant_demo_1",
    username: "manager1",
    name: "Budi Santoso",
    role: UserRole.MANAGER,
    passwordHash: "Manager#2026!",
    email: "budi.santoso@phonepos.id",
    isActive: true,
  },
  {
    id: "EMP003",
    tenantId: "tenant_demo_1",
    username: "cashier1",
    name: "Siti Rahma",
    role: UserRole.CASHIER,
    passwordHash: "Cashier#2026!",
    email: "siti.rahma@phonepos.id",
    isActive: true,
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "SPL001",
    tenantId: "tenant_demo_1",
    name: "PT Teletama Artha Mandiri (TAM)",
    contactPerson: "Bpk. Hendra Gunawan",
    phone: "021-87654321",
    email: "procurement@tam-group.co.id",
    address: "Kawasan Industri Pulogadung, Jakarta Timur",
    category: "Distributor Resmi",
    status: "ACTIVE",
    bankName: "BCA",
    bankAccountName: "PT Teletama Artha Mandiri",
    bankAccountNumber: "0012988341",
    totalDebt: 35000000,
    paidDebt: 15000000,
    remainingDebt: 20000000,
    debtDueDate: "2026-08-10",
    suppliedCategories: ["Smartphone", "Tablet"],
    notes: "Distributor resmi Samsung, Xiaomi, dan Realme. Tempo pembayaran 30 hari.",
    debtPayments: [
      {
        id: "PAY-001",
        supplierId: "SPL001",
        poId: "PO-20260710-001",
        amount: 15000000,
        paymentDate: "2026-07-20",
        paymentMethod: "TRANSFER",
        notes: "Pelunasan tahap 1 PO Xiaomi & Samsung",
        recordedBy: "Budi Santoso"
      }
    ]
  },
  {
    id: "SPL002",
    tenantId: "tenant_demo_1",
    name: "Erajaya Swasembada",
    contactPerson: "Ibu Indah Permata",
    phone: "021-54321098",
    email: "sales.corporate@erajaya.com",
    address: "Jl. Bandengan Selatan No. 19, Jakarta Barat",
    category: "Distributor Resmi",
    status: "ACTIVE",
    bankName: "Mandiri",
    bankAccountName: "PT Erajaya Swasembada Tbk",
    bankAccountNumber: "1180009988112",
    totalDebt: 50000000,
    paidDebt: 50000000,
    remainingDebt: 0,
    debtDueDate: "",
    suppliedCategories: ["Smartphone", "Aksesoris", "Wearable"],
    notes: "Principal resmi Apple iBox & Samsung SEIN. Kredit Tempo 14 hari.",
    debtPayments: [
      {
        id: "PAY-002",
        supplierId: "SPL002",
        poId: "PO-20260701-002",
        amount: 50000000,
        paymentDate: "2026-07-15",
        paymentMethod: "TRANSFER",
        notes: "Pelunasan LUNAS PO iPhone 15 Pro Max",
        recordedBy: "Ricky Commedan"
      }
    ]
  },
  {
    id: "SPL003",
    tenantId: "tenant_demo_1",
    name: "CV Gadget Distrindo",
    contactPerson: "Acan Roxy",
    phone: "0812-3456-7890",
    email: "gadget.distrindo@gmail.com",
    address: "Ruko ITC Roxy Mas Blok D2, Jakarta Pusat",
    category: "Aksesoris & Sparepart",
    status: "ACTIVE",
    bankName: "BCA",
    bankAccountName: "CV Gadget Distrindo",
    bankAccountNumber: "5220918231",
    totalDebt: 12500000,
    paidDebt: 5000000,
    remainingDebt: 7500000,
    debtDueDate: "2026-08-08",
    suppliedCategories: ["Aksesoris", "Sparepart", "Charger"],
    notes: "Supplier kabel, charger Anker/Baseus, tempered glass, dan LCD sparepart Roxy.",
    debtPayments: [
      {
        id: "PAY-003",
        supplierId: "SPL003",
        poId: "PO-20260718-005",
        amount: 5000000,
        paymentDate: "2026-07-25",
        paymentMethod: "TUNAI",
        notes: "Uang muka pembelian tempered glass & casing",
        recordedBy: "Siti Rahma"
      }
    ]
  },
  {
    id: "SPL004",
    tenantId: "tenant_demo_1",
    name: "PT Vivan Tehnologi Indonesia",
    contactPerson: "Kevin Wijaya",
    phone: "0818-0912-3344",
    email: "order@vivan-robot.id",
    address: "Kawasan Industri Citra Raya, Cikupa, Tangerang",
    category: "Aksesoris",
    status: "ACTIVE",
    bankName: "BCA",
    bankAccountName: "PT Vivan Tehnologi Indonesia",
    bankAccountNumber: "8001293810",
    totalDebt: 8000000,
    paidDebt: 0,
    remainingDebt: 8000000,
    debtDueDate: "2026-08-14",
    suppliedCategories: ["Aksesoris", "Powerbank", "Headset"],
    notes: "Supplier resmi Robot & Vivan Accessories. Garansi ganti baru 1 tahun.",
    debtPayments: []
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "PROD001",
    tenantId: "tenant_demo_1",
    name: "iPhone 15 Pro Max 256GB Black Titanium",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    type: "BARU",
    imeis: [
      "352147108924351",
      "352147108924352",
      "352147108924353",
      "352147108924354",
    ],
    purchasedImeisHistory: [
      { imei: "352147108924351", supplier: "Erajaya Swasembada", purchasePrice: 19500000, date: "2026-06-10" },
      { imei: "352147108924352", supplier: "Erajaya Swasembada", purchasePrice: 19500000, date: "2026-06-10" },
      { imei: "352147108924353", supplier: "Erajaya Swasembada", purchasePrice: 19500000, date: "2026-06-12" },
      { imei: "352147108924354", supplier: "Erajaya Swasembada", purchasePrice: 19500000, date: "2026-06-12" },
    ],
    priceBuy: 19500000,
    priceSell: 22999000,
    stock: 4,
    minStockAlert: 2,
    specifications: "Super Retina XDR OLED, A17 Pro Chip, Triple Camera 48MP, 256GB Storage, USB-C 3.0",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "PROD002",
    tenantId: "tenant_demo_1",
    name: "Samsung Galaxy S24 Ultra 12/512GB Titanium Gray",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    type: "BARU",
    imeis: [
      "358241098412091",
      "358241098412092",
      "358241098412093",
    ],
    purchasedImeisHistory: [
      { imei: "358241098412091", supplier: "PT Teletama Artha Mandiri (TAM)", purchasePrice: 17800000, date: "2026-06-15" },
      { imei: "358241098412092", supplier: "PT Teletama Artha Mandiri (TAM)", purchasePrice: 17800000, date: "2026-06-15" },
      { imei: "358241098412093", supplier: "PT Teletama Artha Mandiri (TAM)", purchasePrice: 17800000, date: "2026-06-15" },
    ],
    priceBuy: 17800000,
    priceSell: 20499000,
    stock: 3,
    minStockAlert: 2,
    specifications: "Dynamic AMOLED 2X 120Hz, Snapdragon 8 Gen 3, Quad Camera 200MP, S-Pen Support, 512GB",
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "PROD003",
    tenantId: "tenant_demo_1",
    name: "Xiaomi 14 12/256GB Black",
    brand: "Xiaomi",
    model: "Xiaomi 14",
    type: "BARU",
    imeis: [
      "860145291084251",
    ],
    purchasedImeisHistory: [
      { imei: "860145291084251", supplier: "CV Gadget Distrindo", purchasePrice: 9800000, date: "2026-07-01" },
    ],
    priceBuy: 9800000,
    priceSell: 11999000,
    stock: 1, // Will trigger warning as stock is low (minStockAlert is 2)
    minStockAlert: 2,
    specifications: "LTPO OLED 120Hz, Leica Professional Optics 50MP, Snapdragon 8 Gen 3, 90W HyperCharge",
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "PROD004",
    tenantId: "tenant_demo_1",
    name: "iPhone 13 128GB Blue (Bekas Grade A)",
    brand: "Apple",
    model: "iPhone 13",
    type: "BEKAS",
    condition: "A",
    imeis: [
      "359421087410251",
    ],
    purchasedImeisHistory: [
      { imei: "359421087410251", supplier: "Buyback - Customer Rudi", purchasePrice: 6500000, date: "2026-07-05" },
    ],
    priceBuy: 6500000,
    priceSell: 8499000,
    stock: 1,
    minStockAlert: 1,
    specifications: "Secondhand Grade A (Kondisi Fisik 98%, Baterai Health 87%, Fungsi Normal)",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80",
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "INV/20260712/0001",
    tenantId: "tenant_demo_1",
    customerId: "CUST001",
    customerName: "Ahmad Dahlan",
    customerPhone: "081298765432",
    items: [
      {
        productId: "PROD001",
        name: "iPhone 15 Pro Max 256GB Black Titanium",
        brand: "Apple",
        model: "iPhone 15 Pro Max",
        type: "BARU",
        imei: "352147108924351",
        priceSell: 22999000,
      }
    ],
    totalAmount: 22999000,
    paymentMethod: "MIDTRANS",
    paymentStatus: "PAID",
    midtransOrderId: "MID-SGPOS-1720857600",
    date: "2026-07-12T14:35:00-07:00",
    cashierId: "EMP003",
    cashierName: "Siti Rahma",
  },
  {
    id: "INV/20260713/0001",
    tenantId: "tenant_demo_1",
    customerId: "CUST002",
    customerName: "Clara Amalia",
    customerPhone: "085712345678",
    items: [
      {
        productId: "PROD004",
        name: "iPhone 13 128GB Blue (Bekas Grade A)",
        brand: "Apple",
        model: "iPhone 13",
        type: "BEKAS",
        imei: "359421087410251",
        priceSell: 8499000,
      }
    ],
    totalAmount: 8499000,
    paymentMethod: "TUNAI",
    paymentStatus: "PAID",
    date: "2026-07-13T10:15:00-07:00",
    cashierId: "EMP003",
    cashierName: "Siti Rahma",
  }
];

export const INITIAL_BUYBACKS: Buyback[] = [
  {
    id: "BB/20260713/0001",
    tenantId: "tenant_demo_1",
    customerName: "Rudi Hartono",
    customerPhone: "081987654321",
    customerImei: "359421087410251",
    brand: "Apple",
    model: "iPhone 13",
    condition: "A",
    priceBuy: 6500000,
    notes: "Kondisi fisik mulus, BH 87%, box ada, charger oem.",
    date: "2026-07-13T09:30:00-07:00",
    cashierId: "EMP002",
    cashierName: "Budi Santoso",
    imeiVerified: true,
    imeiStatus: "CLEAN",
  }
];

export const INITIAL_OUTLETS = [
  {
    id: "OUT-001",
    tenantId: "tenant_demo_1",
    code: "PST",
    name: "Outlet Pusat - Mall Ambassador",
    address: "Mall Ambassador Lt. 2 No. 45, Kuningan, Jakarta Selatan",
    phone: "021-5760921",
    isMainBranch: true,
    status: "ACTIVE",
    managerName: "Ricky Commedan",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "OUT-002",
    tenantId: "tenant_demo_1",
    code: "CBG1",
    name: "Cabang 1 - Kelapa Gading",
    address: "Mall Kelapa Gading 3 Lt. G No. 12, Jakarta Utara",
    phone: "021-4585123",
    isMainBranch: false,
    status: "ACTIVE",
    managerName: "Budi Santoso",
    createdAt: "2026-03-15T09:30:00Z"
  },
  {
    id: "OUT-003",
    tenantId: "tenant_demo_1",
    code: "CBG2",
    name: "Cabang 2 - BSD City",
    address: "AEON Mall BSD City Lt. 1 No. 88, Tangerang Selatan",
    phone: "021-2916888",
    isMainBranch: false,
    status: "ACTIVE",
    managerName: "Siti Rahma",
    createdAt: "2026-05-20T10:00:00Z"
  }
];

export const INITIAL_STOCK_TRANSFERS = [
  {
    id: "TRF/20260720/0001",
    tenantId: "tenant_demo_1",
    originOutletId: "OUT-001",
    originOutletName: "Outlet Pusat - Mall Ambassador",
    destinationOutletId: "OUT-002",
    destinationOutletName: "Cabang 1 - Kelapa Gading",
    items: [
      {
        productId: "PROD001",
        productName: "iPhone 15 Pro Max 256GB Black Titanium",
        brand: "Apple",
        model: "iPhone 15 Pro Max",
        type: "BARU",
        imeis: ["352147108924355"],
        quantity: 1,
        notes: "Transfer permintaan stok mendesak cabang Kelapa Gading"
      }
    ],
    status: "RECEIVED",
    senderId: "EMP001",
    senderName: "Ricky Commedan",
    receiverId: "EMP002",
    receiverName: "Budi Santoso",
    sentAt: "2026-07-20T10:15:00Z",
    receivedAt: "2026-07-20T14:30:00Z",
    notes: "Barang sudah diterima fisik dalam kondisi segel mulus"
  },
  {
    id: "TRF/20260721/0002",
    tenantId: "tenant_demo_1",
    originOutletId: "OUT-001",
    originOutletName: "Outlet Pusat - Mall Ambassador",
    destinationOutletId: "OUT-003",
    destinationOutletName: "Cabang 2 - BSD City",
    items: [
      {
        productId: "PROD002",
        productName: "Samsung Galaxy S24 Ultra 12/512GB Titanium Gray",
        brand: "Samsung",
        model: "Galaxy S24 Ultra",
        type: "BARU",
        imeis: ["358241098412094"],
        quantity: 1,
        notes: "Restock mingguan BSD City"
      }
    ],
    status: "IN_TRANSIT",
    senderId: "EMP001",
    senderName: "Ricky Commedan",
    sentAt: "2026-07-21T09:00:00Z",
    notes: "Dikirim via Kurir Internal Express, Plat No. B 4821 KJL"
  }
];

export const INITIAL_PURCHASE_ORDERS: any[] = [
  {
    id: "PO-20260723-001",
    tenantId: "tenant_demo_1",
    supplierId: "SPL001",
    supplierName: "PT Teletama Artha Mandiri (TAM)",
    supplierContactPerson: "Pak Hendra (Sales Manager)",
    supplierPhone: "081298765432",
    supplierAddress: "Kawasan Industri Pulogadung, Jakarta Timur",
    date: "2026-07-23",
    deliveryDateTarget: "2026-07-25",
    paymentTerms: "TEMPO_14",
    items: [
      {
        productId: "PROD002",
        name: "Samsung Galaxy S24 Ultra 12/512GB Titanium Gray",
        brand: "Samsung",
        category: "Smartphone",
        qty: 5,
        priceBuy: 17800000,
        subtotal: 89000000,
        notes: "Unit baru, Garansi Resmi SEIN Indonesia"
      },
      {
        productId: "PROD003",
        name: "Xiaomi 14 12/256GB Black",
        brand: "Xiaomi",
        category: "Smartphone",
        qty: 10,
        priceBuy: 10200000,
        subtotal: 102000000,
        notes: "Garansi Resmi TAM"
      }
    ],
    subtotalAmount: 191000000,
    discountAmount: 1000000,
    taxPpnPercentage: 11,
    taxPpnAmount: 20900000,
    shippingFee: 150000,
    totalAmount: 211050000,
    status: "SENT_TO_SUPPLIER",
    notes: "Mohon barang diisi proteksi bubble wrap tebal dan asuransi pengiriman. Pembayaran via Tempo 14 Hari.",
    createdBy: "EMP001",
    createdByName: "Ricky Commedan",
    createdAt: "2026-07-23T08:00:00Z"
  },
  {
    id: "PO-20260720-002",
    tenantId: "tenant_demo_1",
    supplierId: "SPL002",
    supplierName: "Erajaya Swasembada",
    supplierContactPerson: "Ibu Maya (Grosir Erajaya)",
    supplierPhone: "081187654321",
    supplierAddress: "Jl. Bandengan Selatan No. 19, Jakarta Barat",
    date: "2026-07-20",
    deliveryDateTarget: "2026-07-22",
    paymentTerms: "TRANSFER",
    items: [
      {
        productId: "PROD001",
        name: "iPhone 15 Pro Max 256GB Black Titanium",
        brand: "Apple",
        category: "Smartphone",
        qty: 3,
        priceBuy: 19500000,
        subtotal: 58500000,
        notes: "Resmi iBox / Digimap"
      }
    ],
    subtotalAmount: 58500000,
    discountAmount: 500000,
    taxPpnPercentage: 0,
    taxPpnAmount: 0,
    shippingFee: 100000,
    totalAmount: 58100000,
    status: "CONFIRMED",
    notes: "Sudah dilunasi via Transfer BCA. Menunggu kurir ekspedisi.",
    createdBy: "EMP001",
    createdByName: "Ricky Commedan",
    createdAt: "2026-07-20T10:30:00Z"
  }
];
