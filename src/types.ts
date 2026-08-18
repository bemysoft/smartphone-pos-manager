export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  CASHIER = "CASHIER",
}

export type TenantSubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  ownerName?: string;
  ownerEmail: string;
  phone?: string;
  createdAt: string;
  subscriptionPlan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE" | "TRIAL" | string;
  subscriptionExpiry?: string;
  isTrial?: boolean;
  trialEndsAt?: string;
  isActive: boolean;
  lastReminderSentAt?: string;
  notes?: string;
}

export interface TenantDetailedRecord {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  subscriptionPlan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE" | "TRIAL" | string;
  subscriptionExpiry: string;
  isTrial: boolean;
  trialEndsAt?: string;
  createdAt: string;
  isActive: boolean;
  lastReminderSentAt?: string;
  notes?: string;
  daysRemaining: number;
  status: TenantSubscriptionStatus;
  totalProducts?: number;
  totalTransactions?: number;
  lastActivity?: string;
}

export interface SuperadminSubscriptionStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  expiringThisMonth: number;
  expiringSoon7Days: number;
  expiredTenants: number;
  expiringTenantsList: TenantDetailedRecord[];
}

export interface Employee {
  id: string;
  tenantId: string;
  username: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  email: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  sku?: string;
  name: string;
  brand: string;
  model: string;
  color?: string;
  type: "BARU" | "BEKAS";
  category?: "Smartphone" | "Aksesoris" | "Sparepart" | string;
  condition?: "A" | "B" | "C" | "D" | "-"; // For second-hand phones
  imeis: string[]; // List of available IMEIs for tracking
  purchasedImeisHistory?: { imei: string; supplier: string; purchasePrice: number; date: string }[];
  priceBuy: number; // For buyback or stock purchase
  priceSell: number;
  stock: number; // Must match imeis.length
  minStockAlert: number;
  location?: string;
  specifications?: string;
  imageUrl?: string;
  images?: string[];
  priceHistory?: { date: string; priceSell: number; priceBuy?: number; changeReason?: string }[];
}

export interface TransactionItem {
  productId: string;
  name: string;
  brand: string;
  model: string;
  type: "BARU" | "BEKAS";
  imei: string; // Specific IMEI sold
  priceSell: number;
  quantity?: number;
}

export interface Transaction {
  id: string; // Invoice number (e.g. INV/20260714/0001)
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: TransactionItem[];
  totalAmount: number;
  paymentMethod: "TUNAI" | "TRANSFER" | "QRIS" | "MIDTRANS" | "SPLIT";
  splitPayments?: { method: string; amount: number }[];
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  midtransOrderId?: string;
  date: string;
  cashierId: string;
  cashierName: string;
  salesId?: string;
  salesName?: string;
  isTradeIn?: boolean;
  tradeInBrandModel?: string;
  tradeInImei?: string;
  tradeInCondition?: "A" | "B" | "C" | "D" | "-";
  tradeInValue?: number;
  tradeInNotes?: string;
  notes?: string;
  transactionNote?: string;
  pointsUsed?: number;
  pointsEarned?: number;
  pointsDiscount?: number;
  loyaltyDiscount?: number;
  loyaltyTier?: string;
  subtotalAmount?: number;
  taxPpnPercentage?: number;
  taxPpnAmount?: number;
  customerPointsBefore?: number;
  customerPointsAfter?: number;
  manualDiscount?: number;
  promoDiscount?: number;
  promoDescription?: string;
  promoPrintOnReceipt?: boolean;
  employeeName?: string;
  discountAmount?: number;
  tradeInAllowance?: number;
}

export interface Buyback {
  id: string; // Invoice Buyback (e.g. BB/20260714/0001)
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerImei: string;
  brand: string;
  model: string;
  condition: "A" | "B" | "C" | "D"; // Grade
  priceBuy: number;
  notes?: string;
  date: string;
  cashierId: string;
  cashierName: string;
  imeiVerified: boolean;
  imeiStatus: "CLEAN" | "BLACKLISTED" | "WARRANTY_ACTIVE" | "WARRANTY_EXPIRED";
  linkedProductId?: string;
}

export interface SupplierDebtPayment {
  id: string;
  supplierId: string;
  poId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "TUNAI" | "TRANSFER" | "GIRO" | "EDC";
  notes?: string;
  recordedBy?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address: string;
  category?: string;
  status?: "ACTIVE" | "INACTIVE";
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  totalDebt?: number;
  paidDebt?: number;
  remainingDebt?: number;
  debtDueDate?: string; // Tanggal Jatuh Tempo Pembayaran Hutang (YYYY-MM-DD)
  debtPayments?: SupplierDebtPayment[];
  suppliedCategories?: string[];
  notes?: string;
}

export interface PurchaseOrderItem {
  productId?: string;
  name: string;
  brand?: string;
  category?: string;
  qty: number;
  priceBuy: number; // Harga Beli Satuan / HPP
  subtotal: number;
  notes?: string;
  imeis?: string[]; // Received IMEIs for this PO item
}

export interface PurchaseOrder {
  id: string; // e.g. PO-20260723-001
  tenantId?: string;
  supplierId?: string;
  supplierName: string;
  supplierContactPerson?: string;
  supplierPhone: string; // WA Number
  supplierAddress?: string;
  date: string;
  deliveryDateTarget?: string;
  dueDate?: string; // Tanggal Jatuh Tempo Pembayaran PO
  paymentTerms: "CASH" | "COD" | "TRANSFER" | "TEMPO_14" | "TEMPO_30" | "TEMPO_60";
  items: PurchaseOrderItem[];
  subtotalAmount: number;
  discountAmount?: number;
  taxPpnPercentage?: number; // 0 or 11
  taxPpnAmount?: number;
  shippingFee?: number;
  totalAmount: number;
  status: "DRAFT" | "SENT_TO_SUPPLIER" | "CONFIRMED" | "RECEIVED" | "CANCELLED";
  paymentStatus?: "UNPAID" | "PARTIAL" | "PAID";
  paidAmount?: number;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  receivedAt?: string;
}

export interface PaymentGatewayConfig {
  clientKey: string;
  serverKey: string;
  isProduction: boolean;
}

export interface BackupLog {
  id: string;
  filename: string;
  timestamp: string;
  sizeBytes: number;
  status: "SUCCESS" | "FAILED";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface ImagePromptLog {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: string;
}

export interface StockOpnameItem {
  productId: string;
  productName: string;
  brand?: string;
  model?: string;
  sku?: string;
  category?: string;
  priceBuy: number;
  priceSell: number;
  systemStock: number;
  physicalStock: number;
  shrinkage: number; // systemStock - physicalStock
  discrepancy: number; // physicalStock - systemStock
  missingImeis?: string[];
  notes?: string;
}

export interface StockOpname {
  id: string; // e.g. OPN/20260805/0001
  date: string;
  sessionTitle?: string;
  employeeId: string;
  employeeName: string;
  notes?: string;
  items: StockOpnameItem[];
  totalDiscrepancyItems?: number;
  totalLossAmount?: number;
  totalGainAmount?: number;
  status: "DRAFT" | "COMPLETED";
}

export interface Warranty {
  id: string;
  invoiceId: string;
  customerName: string;
  customerPhone: string;
  imei: string;
  productName: string;
  purchaseDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRED" | "CLAIMED";
  claims: { date: string; description: string }[];
}

export interface ReturnItem {
  productId: string;
  productName: string;
  brand?: string;
  model?: string;
  imei: string;
  reason: string;
  stockCondition: "LAYAK_JUAL" | "RUSAK"; // 'stok layak jual' vs 'stok rusak'
  refundAmount: number;
}

export interface Return {
  id: string;
  invoiceId: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: ReturnItem[];
  totalRefund: number;
  cashierId: string;
  cashierName: string;
  notes?: string;
}

export type ServiceStatus = "TERIMA" | "DALAM_PENGERJAAN" | "SELESAI" | "DIAMBIL";

export interface ServiceStatusLog {
  status: ServiceStatus;
  timestamp: string;
  updatedBy: string;
  notes?: string;
}

export interface ServiceTicket {
  id: string; // e.g. SRV/20260805/0001
  tenantId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deviceBrand: string;
  deviceModel: string;
  deviceImei?: string;
  deviceColor?: string;
  devicePasscode?: string;
  deviceCondition?: string; // Kondisi fisik (e.g. Layar retak, bezel lecet)
  problemDescription: string; // Keluhan / jenis kerusakan
  estimatedCost: number; // Total estimasi biaya
  sparepartCost?: number; // Biaya komponen / sparepart
  laborCost?: number; // Biaya jasa servis
  downPayment?: number; // Uang Muka (DP)
  technicianName?: string;
  status: ServiceStatus; // TERIMA, DALAM_PENGERJAAN, SELESAI, DIAMBIL
  receivedDate: string;
  completedDate?: string;
  pickedUpDate?: string;
  notes?: string;
  statusLogs?: ServiceStatusLog[];
}


export interface SalesTarget {
  userId: string;
  month: string; // YYYY-MM
  targetType?: "AMOUNT" | "UNITS" | "BOTH"; // Type of primary target: Nominal Rp vs Unit sold vs Both
  targetAmount: number; // Target in Rp (e.g. 100,000,000)
  targetUnits?: number; // Target in total units (e.g. 50 units)
  notes?: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  date: string; // YYYY-MM-DD HH:mm:ss
  amount: number;
  paymentMethod: "CASH" | "TRANSFER" | "PAYROLL_DEDUCTION";
  recordedBy: string;
  notes?: string;
  digitalSignatureUrl?: string;
}

export interface EmployeeLoan {
  id: string; // e.g., LOAN-2026-001
  employeeId: string;
  employeeName: string;
  amount: number;
  remainingAmount: number;
  date: string; // YYYY-MM-DD HH:mm:ss
  reason: string;
  status: "ACTIVE" | "PAID_OFF" | "CANCELLED";
  disbursedBy: string;
  digitalSignatureUrl?: string;
  repayments: LoanRepayment[];
  notes?: string;
}

export interface PayrollRecord {
  id: string; // PAY-2026-08-001
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  paymentDate: string; // YYYY-MM-DD HH:mm:ss
  basicSalary: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  loanDeduction: number;
  netSalary: number;
  paymentMethod: "CASH" | "TRANSFER";
  bankName?: string;
  accountNumber?: string;
  status: "PAID" | "DRAFT";
  notes?: string;
  recordedBy: string;
  digitalSignatureUrl?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  points: number;
  role?: "REGULAR" | "MEMBER" | "VIP";
  notes?: string;
}

export interface Outlet {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isMainBranch: boolean;
  status: "ACTIVE" | "INACTIVE";
  managerName?: string;
  createdAt: string;
}

export interface StockTransferItem {
  productId: string;
  productName: string;
  brand: string;
  model: string;
  type?: "BARU" | "BEKAS";
  imeis: string[];
  quantity: number;
  notes?: string;
}

export interface StockTransfer {
  id: string;
  tenantId: string;
  originOutletId: string;
  originOutletName: string;
  destinationOutletId: string;
  destinationOutletName: string;
  items: StockTransferItem[];
  status: "PENDING" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
  senderId: string;
  senderName: string;
  receiverId?: string;
  receiverName?: string;
  sentAt: string;
  receivedAt?: string;
  cancelledAt?: string;
  notes?: string;
}

export interface Promo {
  id: string;
  tenantId: string;
  name: string;
  type: "QUANTITY" | "ROLE" | "BUY_X_GET_Y";
  description: string;
  isActive: boolean;
  minQuantity?: number;
  discountPercentage?: number;
  customerRole?: "REGULAR" | "MEMBER" | "VIP";
  roleDiscountPercentage?: number;
  buyX?: number; // Total items needed
  freeY?: number; // Number of cheapest items free
  validFrom?: string; // e.g. "2024-01-01T00:00"
  validUntil?: string; // e.g. "2024-12-31T23:59"
  printOnReceipt?: boolean;
}

export interface AttendanceRecord {
  id: string;
  tenantId?: string;
  employeeId: string;
  employeeName: string;
  role: UserRole | string;
  clockInTime: string;
  clockOutTime?: string | null;
  durationMinutes?: number | null;
  status: "CLOCKED_IN" | "CLOCKED_OUT";
  notes?: string;
  clockOutNotes?: string;
  date: string; // YYYY-MM-DD
}

export interface MigrationRequestItem {
  id: string;
  tenantId?: string;
  title: string;
  migrationType: "INVENTORY" | "CUSTOMERS" | "ALL";
  fileName: string;
  fileData?: string; // base64 or raw content preview
  recordCount: number;
  status: "Pending" | "In-Progress" | "Completed";
  currentPhase?: "Mapping" | "Uploading" | "Verification" | "Completed";
  phaseHistory?: { phase: string; timestamp: string; notes?: string }[];
  notes?: string;
  submittedBy?: string;
  submittedAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  category: "INVENTORY" | "FINANCIAL" | "SECURITY" | "SYSTEM";
  action: string;
  logType: "CROSS_BRANCH_TRANSFER" | "HIGH_VALUE_TRANSACTION" | "STOCK_ADJUSTMENT" | "CONFLICT_RESOLUTION" | "MUTATION";
  title: string;
  description: string;
  sourceOutletId?: string;
  sourceOutletName?: string;
  destinationOutletId?: string;
  destinationOutletName?: string;
  userId: string;
  userName: string;
  userRole: string;
  items?: { productId?: string; productName: string; brand?: string; model?: string; imeis?: string[]; quantity?: number }[];
  financialValue?: number; // Total rupiah value
  referenceId?: string; // Invoice / Transfer / Sync ID
  timestamp: string;
  verificationStatus: "VERIFIED_SAME_TENANT" | "VERIFIED_CROSS_BRANCH" | "RESOLVED_CONFLICT" | "SYSTEM_LOG";
}

export interface SyncConflict {
  id: string;
  tenantId: string;
  outletId: string;
  outletName: string;
  productId: string;
  productName: string;
  brand: string;
  model: string;
  conflictType: "STOCK_QUANTITY_MISMATCH" | "IMEI_DUPLICATION" | "OFFLINE_SYNC_COLLISION" | "PRICE_DISCREPANCY";
  localData: {
    stock: number;
    priceSell: number;
    imeis: string[];
    updatedAt: string;
    outletName: string;
  };
  cloudData: {
    stock: number;
    priceSell: number;
    imeis: string[];
    updatedAt: string;
    outletName: string;
  };
  status: "OPEN" | "RESOLVED";
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionStrategy?: "KEEP_LOCAL" | "KEEP_CLOUD" | "MERGE" | "MANUAL_OVERRIDE";
  resolutionNotes?: string;
  createdAt: string;
}

