import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql, { Pool, RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Define Data Models and In-Memory/Disk Document Store
export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'manager' | 'cashier' | 'accountant' | string;
  phone: string;
  isActive: boolean;
  biometricEnabled?: boolean;
  biometricToken?: string;
  createdAt: string;
}

export interface IRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface IBusiness {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  somtelPhone?: string;
  salamBankAcc?: string;
  email: string;
  address: string;
  logo: string;
  registrationNumber: string;
  taxRate: number; // e.g. 5%
  insuranceRate: number; // e.g. 1%
  taxEnabled: boolean;
  insuranceEnabled: boolean;
  currency: string; // 'USD' | 'SOS' | 'KES' | 'SLSH' | 'ETB' | 'DJF'
  currencySymbol: string;
  receiptFooter: string;
  supportPhone: string;
  supportWhatsApp: string;
  dialCodeUSSD: string; // *712*611688269*30#
  somtelUSSD?: string; // *110*621688269*30#
  salamBankUSSD?: string; // *714*38524624*30#
  subscriptionPlan: string;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  trialStartedAt?: string;
  subscriptionExpiry: string;
}

export interface ICustomer {
  id: string;
  customerId: string; // CUST-001
  name: string;
  phone: string;
  email?: string;
  address?: string;
  openingBalance: number;
  totalCredit: number;
  totalPayments: number;
  currentBalance: number; // opening + credit - payments
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomerLedgerEntry {
  id: string;
  customerId: string;
  date: string;
  type: 'OPENING_BALANCE' | 'CREDIT_SALE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  description: string;
  debit: number; // Increases customer debt
  credit: number; // Decreases customer debt (payments, refunds)
  previousBalance: number;
  newBalance: number;
  referenceId?: string; // invoiceId or paymentId
  paymentMethod?: string;
  createdBy: string;
}

export interface ICustomerPayment {
  id: string;
  paymentNumber: string; // PAY-2026-001
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  reference?: string;
  invoiceAllocations: { invoiceId: string; invoiceNumber: string; amountAllocated: number }[];
  previousBalance: number;
  newBalance: number;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface ISupplier {
  id: string;
  supplierId: string; // SUPP-001
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  openingBalance: number;
  totalPurchases: number;
  totalPayments: number;
  currentBalance: number; // opening + purchases - payments
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ISupplierLedgerEntry {
  id: string;
  supplierId: string;
  date: string;
  type: 'OPENING_BALANCE' | 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT';
  description: string;
  debit: number; // Decreases supplier debt (our payment to them)
  credit: number; // Increases supplier debt (purchases on credit)
  previousBalance: number;
  newBalance: number;
  referenceId?: string;
  paymentMethod?: string;
  createdBy: string;
}

export interface ISupplierPayment {
  id: string;
  paymentNumber: string; // SPAY-2026-001
  supplierId: string;
  supplierName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  reference?: string;
  purchaseAllocations: { purchaseId: string; purchaseNumber: string; amountAllocated: number }[];
  previousBalance: number;
  newBalance: number;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface IProduct {
  id: string;
  productId: string; // PRD-001
  name: string;
  sku: string;
  qrCode: string;
  category: string;
  brand: string;
  purchaseCost: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  supplierId?: string;
  supplierName?: string;
  expiryDate?: string;
  image?: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  id: string;
  name: string;
  description: string;
  itemCount?: number;
}

export interface IBrand {
  id: string;
  name: string;
  origin?: string;
}

export interface IInvoiceItem {
  productId: string;
  name: string;
  sku: string;
  qrCode: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface IInvoice {
  id: string;
  invoiceNumber: string; // INV-2026-0001
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  cashierId: string;
  cashierName: string;
  items: IInvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  insuranceTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMethod: string;
  saleType: 'CASH' | 'CREDIT';
  cashReceived?: number;
  cashChange?: number;
  date: string;
  notes?: string;
  isPOS: boolean;
  isRefunded?: boolean;
  refundReason?: string;
  createdAt: string;
}

export interface IPurchaseItem {
  productId: string;
  name: string;
  sku: string;
  unitCost: number;
  quantity: number;
  total: number;
}

export interface IPurchase {
  id: string;
  purchaseNumber: string; // PO-2026-0001
  supplierId: string;
  supplierName: string;
  items: IPurchaseItem[];
  totalCost: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'RECEIVED' | 'PENDING' | 'CANCELLED';
  date: string;
  notes?: string;
  receivedDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface IStockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'INITIAL' | 'PURCHASE_RECEIVE' | 'POS_SALE' | 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN' | 'ADJUSTMENT' | 'DAMAGED' | 'EXPIRED';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  referenceId?: string;
  reason: string;
  createdBy: string;
}

export interface IAuditLog {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
}

export interface ISubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string; // '7 Days (24h × 7)' | 'Monthly' | 'Yearly'
  durationHours: number; // 168 (24*7) | 720 (24*30) | 8760 (24*365)
  userLimit: number;
  productLimit: number;
  features: string[];
  popular?: boolean;
  ussdCommand: string;
  somtelUssdCommand?: string;
  salamBankAccount?: string;
  waafiPayNumbers?: string[];
}

export interface IDatabaseSchema {
  users: IUser[];
  roles: IRole[];
  business: IBusiness;
  customers: ICustomer[];
  customerLedger: ICustomerLedgerEntry[];
  customerPayments: ICustomerPayment[];
  suppliers: ISupplier[];
  supplierLedger: ISupplierLedgerEntry[];
  supplierPayments: ISupplierPayment[];
  products: IProduct[];
  categories: ICategory[];
  brands: IBrand[];
  invoices: IInvoice[];
  purchases: IPurchase[];
  stockMovements: IStockMovement[];
  auditLogs: IAuditLog[];
  subscriptionPlans: ISubscriptionPlan[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'shop_db.json');

class DatabaseStore {
  private data: IDatabaseSchema;
  private isLoaded = false;
  private pool: Pool | null = null;
  private cloudConnected = false;

  constructor() {
    this.data = this.getDefaultData();
    this.load();
  }

  private getDefaultData(): IDatabaseSchema {
    // Current date timestamp
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    // 7-Day (24h × 7 = 168 hours) Trial Expiration Timestamp
    const sevenDayExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const devPasswordHash = bcrypt.hashSync('admin123', 10);

    const defaults: IDatabaseSchema = {
      users: process.env.NODE_ENV === 'production'
        ? (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD
          ? [{
              id: 'usr_admin',
              name: process.env.BOOTSTRAP_ADMIN_NAME || 'Administrator',
              email: process.env.BOOTSTRAP_ADMIN_EMAIL,
              passwordHash: bcrypt.hashSync(process.env.BOOTSTRAP_ADMIN_PASSWORD, 12),
              role: 'admin',
              phone: '',
              isActive: true,
              createdAt: now,
            }]
          : [])
        : [
        {
          id: 'usr_admin',
          name: 'Maqsuud Director',
          email: 'admin@maqsuudict.com',
          // password: admin123
          passwordHash: devPasswordHash,
          role: 'admin',
          phone: '0611688269',
          isActive: true,
          createdAt: now,
        },
        {
          id: 'usr_manager',
          name: 'Ahmed Shire',
          email: 'manager@maqsuudict.com',
          passwordHash: devPasswordHash,
          role: 'manager',
          phone: '0621688269',
          isActive: true,
          createdAt: now,
        },
        {
          id: 'usr_cashier',
          name: 'Fatima Abdi',
          email: 'cashier@maqsuudict.com',
          passwordHash: devPasswordHash,
          role: 'cashier',
          phone: '+252 617 889 900',
          isActive: true,
          createdAt: now,
        },
        {
          id: 'usr_accountant',
          name: 'Mustafa Jama',
          email: 'accountant@maqsuudict.com',
          passwordHash: devPasswordHash,
          role: 'accountant',
          phone: '+252 618 334 455',
          isActive: true,
          createdAt: now,
        },
      ],
      roles: [
        {
          id: 'role_admin',
          name: 'Admin',
          description: 'Full administrative access to all features, finances, and system settings',
          permissions: ['all', 'view_reports', 'manage_users', 'manage_settings', 'pos_access', 'manage_inventory', 'manage_debts', 'manage_purchases', 'approve_refunds'],
          isSystem: true,
        },
        {
          id: 'role_manager',
          name: 'Manager',
          description: 'Manage inventory, purchases, reports, and oversee customer operations',
          permissions: ['view_reports', 'pos_access', 'manage_inventory', 'manage_debts', 'manage_purchases', 'approve_refunds'],
          isSystem: true,
        },
        {
          id: 'role_cashier',
          name: 'Cashier',
          description: 'Checkout sales via POS, scan QR codes, create invoices, and receive cash',
          permissions: ['pos_access', 'view_products', 'create_sales', 'print_receipts'],
          isSystem: true,
        },
        {
          id: 'role_accountant',
          name: 'Accountant',
          description: 'Financial oversight, customer & supplier debts, sales & rasiid, and tax reports',
          permissions: ['view_reports', 'manage_debts', 'export_financials', 'view_ledger', 'record_payments'],
          isSystem: true,
        },
      ],
      business: {
        id: 'biz_01',
        name: 'Maqsuud ICT — Smart POS & Enterprise Management',
        ownerName: 'Maqsuud Director',
        phone: '0611688269',
        somtelPhone: '0621688269',
        salamBankAcc: '38524624',
        email: 'info@maqsuudict.com',
        address: 'KM4 ICT & Business Hub, Mogadishu, Somalia',
        logo: '/assets/logo.png',
        registrationNumber: 'SO-MOG-2026-98124',
        taxRate: 5,
        insuranceRate: 1,
        taxEnabled: true,
        insuranceEnabled: false,
        currency: 'USD',
        currencySymbol: '$',
        receiptFooter: 'Mahadsanid! EVC/WaafiPay: 0611688269 | Somtel/WaafiPay: 0621688269 | Salaam Bank AccN: 38524624',
        supportPhone: '0611688269 / 0621688269',
        supportWhatsApp: 'https://wa.me/252611688269',
        dialCodeUSSD: '*712*611688269*30#',
        somtelUSSD: '*110*621688269*30#',
        salamBankUSSD: '*714*38524624*30#',
        subscriptionPlan: '7-Day Free Trial',
        subscriptionStatus: 'trial',
        trialStartedAt: now,
        subscriptionExpiry: sevenDayExpiry,
      },
      categories: [
        { id: 'cat_01', name: 'Electronics & Phones', description: 'Smartphones, chargers, tablets and tech accessories' },
        { id: 'cat_02', name: 'Supermarket & Groceries', description: 'Food supplies, beverages, household essentials' },
        { id: 'cat_03', name: 'Computers & Office', description: 'Laptops, printers, paper and stationery' },
        { id: 'cat_04', name: 'Clothing & Fashion', description: 'Apparel, shoes, accessories' },
        { id: 'cat_05', name: 'Hardware & Tools', description: 'Equipment, cables, electrical components' },
      ],
      brands: [
        { id: 'br_01', name: 'Samsung', origin: 'South Korea' },
        { id: 'br_02', name: 'Apple', origin: 'USA' },
        { id: 'br_03', name: 'Xiaomi', origin: 'China' },
        { id: 'br_04', name: 'Anker', origin: 'USA' },
        { id: 'br_05', name: 'HP', origin: 'USA' },
        { id: 'br_06', name: 'Nestle', origin: 'Switzerland' },
      ],
      products: [
        {
          id: 'prd_01',
          productId: 'PRD-1001',
          name: 'Samsung Galaxy A55 5G 128GB',
          sku: 'SAM-A55-128',
          qrCode: 'QR-SAM-A55',
          category: 'Electronics & Phones',
          brand: 'Samsung',
          purchaseCost: 280.00,
          sellingPrice: 340.00,
          stock: 24,
          minStock: 5,
          unit: 'pcs',
          supplierId: 'sup_01',
          supplierName: 'Horn Electronics Wholesale',
          image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80',
          description: 'Awesome Navy, Super AMOLED display, 50MP camera',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'prd_02',
          productId: 'PRD-1002',
          name: 'Anker PowerCore 20,000mAh Fast Bank',
          sku: 'ANK-PWR-20K',
          qrCode: 'QR-ANK-20K',
          category: 'Electronics & Phones',
          brand: 'Anker',
          purchaseCost: 22.00,
          sellingPrice: 35.00,
          stock: 48,
          minStock: 10,
          unit: 'pcs',
          supplierId: 'sup_01',
          supplierName: 'Horn Electronics Wholesale',
          image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
          description: 'High capacity dual USB fast charge powerbank',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'prd_03',
          productId: 'PRD-1003',
          name: 'HP LaserJet Pro MFP Wireless Printer',
          sku: 'HP-LJP-MFP',
          qrCode: 'QR-HP-PRINT',
          category: 'Computers & Office',
          brand: 'HP',
          purchaseCost: 195.00,
          sellingPrice: 260.00,
          stock: 8,
          minStock: 3,
          unit: 'pcs',
          supplierId: 'sup_02',
          supplierName: 'Mogadishu Tech Importers',
          image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
          description: 'Monochrome laser multifunction printer with Wi-Fi',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'prd_04',
          productId: 'PRD-1004',
          name: 'USB-C to Lightning Braided Fast Cable 2M',
          sku: 'CAB-USBC-2M',
          qrCode: 'QR-CAB-USBC-2M',
          category: 'Electronics & Phones',
          brand: 'Anker',
          purchaseCost: 4.50,
          sellingPrice: 9.00,
          stock: 85,
          minStock: 15,
          unit: 'pcs',
          supplierId: 'sup_01',
          supplierName: 'Horn Electronics Wholesale',
          image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
          description: 'Heavy duty nylon braided high-speed cable',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'prd_05',
          productId: 'PRD-1005',
          name: 'Nido Fortified Milk Powder 2.5kg Can',
          sku: 'GROC-NIDO-25',
          qrCode: 'QR-NIDO-25K',
          category: 'Supermarket & Groceries',
          brand: 'Nestle',
          purchaseCost: 21.00,
          sellingPrice: 26.50,
          stock: 35,
          minStock: 8,
          unit: 'can',
          supplierId: 'sup_03',
          supplierName: 'Barakaat Foods & Commodities',
          image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80',
          description: 'Full cream milk powder for families',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'prd_06',
          productId: 'PRD-1006',
          name: 'Logitech MK270 Wireless Keyboard & Mouse Combo',
          sku: 'LOG-MK270',
          qrCode: 'QR-LOG-MK270',
          category: 'Computers & Office',
          brand: 'HP',
          purchaseCost: 18.00,
          sellingPrice: 28.00,
          stock: 19,
          minStock: 5,
          unit: 'set',
          supplierId: 'sup_02',
          supplierName: 'Mogadishu Tech Importers',
          image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
          description: 'Long battery life 2.4GHz wireless combo',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'prd_07',
          productId: 'PRD-1007',
          name: 'Wireless Barcode & QR Code Scanner 2.4G',
          sku: 'SCAN-QR-24G',
          qrCode: 'QR-SCANNER-PRD',
          category: 'Hardware & Tools',
          brand: 'Anker',
          purchaseCost: 32.00,
          sellingPrice: 55.00,
          stock: 12,
          minStock: 4,
          unit: 'pcs',
          supplierId: 'sup_02',
          supplierName: 'Mogadishu Tech Importers',
          image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80',
          description: 'Plug-and-play instant CMOS scanner for retail shops',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'prd_08',
          productId: 'PRD-1008',
          name: 'Apple 20W USB-C Power Adapter',
          sku: 'APP-20W-PWR',
          qrCode: 'QR-APP-20W',
          category: 'Electronics & Phones',
          brand: 'Apple',
          purchaseCost: 15.00,
          sellingPrice: 24.00,
          stock: 4, // LOW STOCK TRIGGER
          minStock: 10,
          unit: 'pcs',
          supplierId: 'sup_01',
          supplierName: 'Horn Electronics Wholesale',
          image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
          description: 'Original Apple 20W fast charging plug',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
      customers: [
        {
          id: 'cust_01',
          customerId: 'CUST-001',
          name: 'Hassan Omar Ali',
          phone: '+252 615 220 190',
          email: 'hassan.omar@gmail.com',
          address: 'Bakaara Market, Hodan, Mogadishu',
          openingBalance: 150.00,
          totalCredit: 680.00,
          totalPayments: 450.00,
          currentBalance: 380.00, // owes 380 USD
          notes: 'Regular wholesale buyer for regional retail shop',
          isArchived: false,
          createdAt: '2026-09-01T10:00:00.000Z',
          updatedAt: now,
        },
        {
          id: 'cust_02',
          customerId: 'CUST-002',
          name: 'Amina Mohamed Diriye',
          phone: '+252 616 991 223',
          email: 'amina.diriye@outlook.com',
          address: 'Waberi District, Mogadishu',
          openingBalance: 0.00,
          totalCredit: 340.00,
          totalPayments: 340.00,
          currentBalance: 0.00,
          notes: 'Always pays immediately via EVC Plus',
          isArchived: false,
          createdAt: '2026-09-10T12:00:00.000Z',
          updatedAt: now,
        },
        {
          id: 'cust_03',
          customerId: 'CUST-003',
          name: 'Dahir Farhan Gedi',
          phone: '+252 617 445 566',
          email: 'dahir.gedi@gmail.com',
          address: 'Hamar Weyne, Mogadishu',
          openingBalance: 50.00,
          totalCredit: 420.00,
          totalPayments: 200.00,
          currentBalance: 270.00,
          notes: 'Credit approved limit $500',
          isArchived: false,
          createdAt: '2026-09-15T09:30:00.000Z',
          updatedAt: now,
        },
        {
          id: 'cust_04',
          customerId: 'CUST-004',
          name: 'Warsame Abukar Nuur',
          phone: '+252 612 778 899',
          email: 'warsame.nuur@yahoo.com',
          address: 'Madina, Wadajir, Mogadishu',
          openingBalance: 0.00,
          totalCredit: 0.00,
          totalPayments: 0.00,
          currentBalance: 0.00,
          notes: 'Walk-in cash customer',
          isArchived: false,
          createdAt: '2026-10-01T14:15:00.000Z',
          updatedAt: now,
        },
      ],
      customerLedger: [
        {
          id: 'cld_01',
          customerId: 'cust_01',
          date: '2026-09-01T10:00:00.000Z',
          type: 'OPENING_BALANCE',
          description: 'Initial customer debt balance',
          debit: 150.00,
          credit: 0.00,
          previousBalance: 0.00,
          newBalance: 150.00,
          createdBy: 'Maqsuud Director',
        },
        {
          id: 'cld_02',
          customerId: 'cust_01',
          date: '2026-09-15T11:20:00.000Z',
          type: 'CREDIT_SALE',
          description: 'Sales Invoice INV-2026-0001 (Credit Sale)',
          debit: 680.00,
          credit: 0.00,
          previousBalance: 150.00,
          newBalance: 830.00,
          referenceId: 'inv_01',
          createdBy: 'Fatima Abdi',
        },
        {
          id: 'cld_03',
          customerId: 'cust_01',
          date: '2026-09-28T16:45:00.000Z',
          type: 'PAYMENT',
          description: 'Partial payment received via EVC Plus (*712*)',
          debit: 0.00,
          credit: 450.00,
          previousBalance: 830.00,
          newBalance: 380.00,
          referenceId: 'pay_01',
          paymentMethod: 'EVC Plus / Zaad',
          createdBy: 'Mustafa Jama',
        },
        {
          id: 'cld_04',
          customerId: 'cust_03',
          date: '2026-09-15T09:30:00.000Z',
          type: 'OPENING_BALANCE',
          description: 'Opening balance owed',
          debit: 50.00,
          credit: 0.00,
          previousBalance: 0.00,
          newBalance: 50.00,
          createdBy: 'Maqsuud Director',
        },
        {
          id: 'cld_05',
          customerId: 'cust_03',
          date: '2026-10-02T14:10:00.000Z',
          type: 'CREDIT_SALE',
          description: 'Sales Invoice INV-2026-0003 (Credit)',
          debit: 420.00,
          credit: 0.00,
          previousBalance: 50.00,
          newBalance: 470.00,
          referenceId: 'inv_03',
          createdBy: 'Fatima Abdi',
        },
        {
          id: 'cld_06',
          customerId: 'cust_03',
          date: '2026-10-08T15:00:00.000Z',
          type: 'PAYMENT',
          description: 'Payment received via Sahal Cash',
          debit: 0.00,
          credit: 200.00,
          previousBalance: 470.00,
          newBalance: 270.00,
          referenceId: 'pay_02',
          paymentMethod: 'Sahal',
          createdBy: 'Mustafa Jama',
        },
      ],
      customerPayments: [
        {
          id: 'pay_01',
          paymentNumber: 'PAY-2026-0001',
          customerId: 'cust_01',
          customerName: 'Hassan Omar Ali',
          amount: 450.00,
          date: '2026-09-28T16:45:00.000Z',
          paymentMethod: 'EVC Plus / Zaad',
          reference: 'EVC-TRX-882914',
          invoiceAllocations: [{ invoiceId: 'inv_01', invoiceNumber: 'INV-2026-0001', amountAllocated: 450.00 }],
          previousBalance: 830.00,
          newBalance: 380.00,
          note: 'Deposit for wholesale mobile supply',
          createdBy: 'Mustafa Jama',
          createdAt: '2026-09-28T16:45:00.000Z',
        },
        {
          id: 'pay_02',
          paymentNumber: 'PAY-2026-0002',
          customerId: 'cust_03',
          customerName: 'Dahir Farhan Gedi',
          amount: 200.00,
          date: '2026-10-08T15:00:00.000Z',
          paymentMethod: 'Sahal',
          reference: 'SHL-99120',
          invoiceAllocations: [{ invoiceId: 'inv_03', invoiceNumber: 'INV-2026-0003', amountAllocated: 200.00 }],
          previousBalance: 470.00,
          newBalance: 270.00,
          note: 'Account settlement instalment',
          createdBy: 'Mustafa Jama',
          createdAt: '2026-10-08T15:00:00.000Z',
        },
      ],
      suppliers: [
        {
          id: 'sup_01',
          supplierId: 'SUPP-001',
          name: 'Horn Electronics Wholesale',
          contactPerson: 'Khadar Guled',
          phone: '+252 615 700 800',
          email: 'sales@hornelectronics.so',
          address: 'Bakaara Tech Quarter, Mogadishu',
          openingBalance: 400.00,
          totalPurchases: 3200.00,
          totalPayments: 2800.00,
          currentBalance: 800.00, // We owe them $800
          notes: 'Main distributor of Samsung and Anker gear in Somalia',
          isArchived: false,
          createdAt: '2026-08-15T08:00:00.000Z',
          updatedAt: now,
        },
        {
          id: 'sup_02',
          supplierId: 'SUPP-002',
          name: 'Mogadishu Tech Importers',
          contactPerson: 'Abdirahman Warsame',
          phone: '+252 616 333 444',
          email: 'abdirahman@mogadishutech.com',
          address: 'Taleex Road, Hodan, Mogadishu',
          openingBalance: 0.00,
          totalPurchases: 1850.00,
          totalPayments: 1500.00,
          currentBalance: 350.00,
          notes: 'IT hardware, cables, and point of sale equipment supplier',
          isArchived: false,
          createdAt: '2026-08-20T09:00:00.000Z',
          updatedAt: now,
        },
        {
          id: 'sup_03',
          supplierId: 'SUPP-003',
          name: 'Barakaat Foods & Commodities',
          contactPerson: 'Suleiman Adan',
          phone: '+252 618 990 011',
          email: 'barakaatfoods@gmail.com',
          address: 'Suuq Bacaad, Yaaqshiid, Mogadishu',
          openingBalance: 0.00,
          totalPurchases: 950.00,
          totalPayments: 950.00,
          currentBalance: 0.00,
          notes: 'Grocery imports from Dubai and Turkey',
          isArchived: false,
          createdAt: '2026-09-01T11:00:00.000Z',
          updatedAt: now,
        },
      ],
      supplierLedger: [
        {
          id: 'sld_01',
          supplierId: 'sup_01',
          date: '2026-08-15T08:00:00.000Z',
          type: 'OPENING_BALANCE',
          description: 'Supplier opening debt balance',
          debit: 0.00,
          credit: 400.00, // Increases our debt to supplier
          previousBalance: 0.00,
          newBalance: 400.00,
          createdBy: 'Maqsuud Director',
        },
        {
          id: 'sld_02',
          supplierId: 'sup_01',
          date: '2026-09-10T10:00:00.000Z',
          type: 'PURCHASE',
          description: 'Purchase Invoice PO-2026-0001',
          debit: 0.00,
          credit: 3200.00,
          previousBalance: 400.00,
          newBalance: 3600.00,
          referenceId: 'po_01',
          createdBy: 'Ahmed Shire',
        },
        {
          id: 'sld_03',
          supplierId: 'sup_01',
          date: '2026-09-20T14:30:00.000Z',
          type: 'PAYMENT',
          description: 'Supplier wire transfer via Premier Bank',
          debit: 2800.00,
          credit: 0.00,
          previousBalance: 3600.00,
          newBalance: 800.00,
          referenceId: 'spay_01',
          paymentMethod: 'Bank Transfer',
          createdBy: 'Mustafa Jama',
        },
      ],
      supplierPayments: [
        {
          id: 'spay_01',
          paymentNumber: 'SPAY-2026-0001',
          supplierId: 'sup_01',
          supplierName: 'Horn Electronics Wholesale',
          amount: 2800.00,
          date: '2026-09-20T14:30:00.000Z',
          paymentMethod: 'Bank Transfer',
          reference: 'PRM-TX-44021',
          purchaseAllocations: [{ purchaseId: 'po_01', purchaseNumber: 'PO-2026-0001', amountAllocated: 2800.00 }],
          previousBalance: 3600.00,
          newBalance: 800.00,
          note: 'Payment for Samsung Galaxy stock delivery',
          createdBy: 'Mustafa Jama',
          createdAt: '2026-09-20T14:30:00.000Z',
        },
      ],
      invoices: [
        {
          id: 'inv_01',
          invoiceNumber: 'INV-2026-0001',
          customerId: 'cust_01',
          customerName: 'Hassan Omar Ali',
          customerPhone: '+252 615 220 190',
          cashierId: 'usr_cashier',
          cashierName: 'Fatima Abdi',
          items: [
            {
              productId: 'prd_01',
              name: 'Samsung Galaxy A55 5G 128GB',
              sku: 'SAM-A55-128',
              qrCode: 'QR-SAM-A55',
              unitCost: 280.00,
              unitPrice: 340.00,
              quantity: 2,
              subtotal: 680.00,
              discount: 0.00,
              total: 680.00,
            },
          ],
          subtotal: 680.00,
          discountTotal: 0.00,
          taxTotal: 0.00,
          insuranceTotal: 0.00,
          grandTotal: 680.00,
          amountPaid: 0.00,
          balanceDue: 680.00,
          paymentStatus: 'PARTIAL', // after pay_01 of 450, balance became 230 on this invoice
          paymentMethod: 'Credit',
          saleType: 'CREDIT',
          date: '2026-09-15T11:20:00.000Z',
          notes: 'Credit sale approved for wholesale order',
          isPOS: true,
          createdAt: '2026-09-15T11:20:00.000Z',
        },
        {
          id: 'inv_02',
          invoiceNumber: 'INV-2026-0002',
          customerName: 'Amina Mohamed Diriye',
          customerId: 'cust_02',
          customerPhone: '+252 616 991 223',
          cashierId: 'usr_cashier',
          cashierName: 'Fatima Abdi',
          items: [
            {
              productId: 'prd_01',
              name: 'Samsung Galaxy A55 5G 128GB',
              sku: 'SAM-A55-128',
              qrCode: 'QR-SAM-A55',
              unitCost: 280.00,
              unitPrice: 340.00,
              quantity: 1,
              subtotal: 340.00,
              discount: 0.00,
              total: 340.00,
            },
          ],
          subtotal: 340.00,
          discountTotal: 0.00,
          taxTotal: 0.00,
          insuranceTotal: 0.00,
          grandTotal: 340.00,
          amountPaid: 340.00,
          balanceDue: 0.00,
          paymentStatus: 'PAID',
          paymentMethod: 'EVC Plus',
          saleType: 'CASH',
          cashReceived: 340.00,
          cashChange: 0.00,
          date: '2026-10-01T15:00:00.000Z',
          notes: 'Paid instantly via mobile money',
          isPOS: true,
          createdAt: '2026-10-01T15:00:00.000Z',
        },
        {
          id: 'inv_03',
          invoiceNumber: 'INV-2026-0003',
          customerName: 'Dahir Farhan Gedi',
          customerId: 'cust_03',
          customerPhone: '+252 617 445 566',
          cashierId: 'usr_cashier',
          cashierName: 'Fatima Abdi',
          items: [
            {
              productId: 'prd_02',
              name: 'Anker PowerCore 20,000mAh Fast Bank',
              sku: 'ANK-PWR-20K',
              qrCode: 'QR-ANK-20K',
              unitCost: 22.00,
              unitPrice: 35.00,
              quantity: 12,
              subtotal: 420.00,
              discount: 0.00,
              total: 420.00,
            },
          ],
          subtotal: 420.00,
          discountTotal: 0.00,
          taxTotal: 0.00,
          insuranceTotal: 0.00,
          grandTotal: 420.00,
          amountPaid: 200.00,
          balanceDue: 220.00,
          paymentStatus: 'PARTIAL',
          paymentMethod: 'Credit',
          saleType: 'CREDIT',
          date: '2026-10-02T14:10:00.000Z',
          notes: 'Wholesale powerbanks with $200 deposit',
          isPOS: true,
          createdAt: '2026-10-02T14:10:00.000Z',
        },
        {
          id: 'inv_04',
          invoiceNumber: 'INV-2026-0004',
          customerName: 'Walk-in Retail Customer',
          cashierId: 'usr_cashier',
          cashierName: 'Fatima Abdi',
          items: [
            {
              productId: 'prd_04',
              name: 'USB-C to Lightning Braided Fast Cable 2M',
              sku: 'CAB-USBC-2M',
              qrCode: 'QR-CAB-USBC-2M',
              unitCost: 4.50,
              unitPrice: 9.00,
              quantity: 2,
              subtotal: 18.00,
              discount: 0.00,
              total: 18.00,
            },
            {
              productId: 'prd_02',
              name: 'Anker PowerCore 20,000mAh Fast Bank',
              sku: 'ANK-PWR-20K',
              qrCode: 'QR-ANK-20K',
              unitCost: 22.00,
              unitPrice: 35.00,
              quantity: 1,
              subtotal: 35.00,
              discount: 3.00,
              total: 32.00,
            },
          ],
          subtotal: 53.00,
          discountTotal: 3.00,
          taxTotal: 2.50,
          insuranceTotal: 0.00,
          grandTotal: 52.50,
          amountPaid: 60.00,
          balanceDue: 0.00,
          paymentStatus: 'PAID',
          paymentMethod: 'Cash',
          saleType: 'CASH',
          cashReceived: 60.00,
          cashChange: 7.50,
          date: `${todayStr}T10:30:00.000Z`,
          notes: 'Today walk-in checkout with discount',
          isPOS: true,
          createdAt: `${todayStr}T10:30:00.000Z`,
        },
      ],
      purchases: [
        {
          id: 'po_01',
          purchaseNumber: 'PO-2026-0001',
          supplierId: 'sup_01',
          supplierName: 'Horn Electronics Wholesale',
          items: [
            {
              productId: 'prd_01',
              name: 'Samsung Galaxy A55 5G 128GB',
              sku: 'SAM-A55-128',
              unitCost: 280.00,
              quantity: 10,
              total: 2800.00,
            },
            {
              productId: 'prd_02',
              name: 'Anker PowerCore 20,000mAh Fast Bank',
              sku: 'ANK-PWR-20K',
              unitCost: 20.00,
              quantity: 20,
              total: 400.00,
            },
          ],
          totalCost: 3200.00,
          amountPaid: 2800.00,
          balanceDue: 400.00,
          paymentStatus: 'PARTIAL',
          status: 'RECEIVED',
          date: '2026-09-10T10:00:00.000Z',
          receivedDate: '2026-09-10T14:00:00.000Z',
          notes: 'Stock received and verified into inventory',
          createdBy: 'Ahmed Shire',
          createdAt: '2026-09-10T10:00:00.000Z',
        },
      ],
      stockMovements: [
        {
          id: 'sm_01',
          date: '2026-09-01T08:00:00.000Z',
          productId: 'prd_01',
          productName: 'Samsung Galaxy A55 5G 128GB',
          sku: 'SAM-A55-128',
          type: 'INITIAL',
          quantityChange: 15,
          previousStock: 0,
          newStock: 15,
          unitCost: 280.00,
          reason: 'Initial system opening count',
          createdBy: 'Maqsuud Director',
        },
        {
          id: 'sm_02',
          date: '2026-09-10T14:00:00.000Z',
          productId: 'prd_01',
          productName: 'Samsung Galaxy A55 5G 128GB',
          sku: 'SAM-A55-128',
          type: 'PURCHASE_RECEIVE',
          quantityChange: 10,
          previousStock: 15,
          newStock: 25,
          unitCost: 280.00,
          referenceId: 'po_01',
          reason: 'Received goods from PO-2026-0001',
          createdBy: 'Ahmed Shire',
        },
        {
          id: 'sm_03',
          date: '2026-09-15T11:20:00.000Z',
          productId: 'prd_01',
          productName: 'Samsung Galaxy A55 5G 128GB',
          sku: 'SAM-A55-128',
          type: 'POS_SALE',
          quantityChange: -2,
          previousStock: 25,
          newStock: 23,
          unitCost: 280.00,
          referenceId: 'inv_01',
          reason: 'Sold via Invoice INV-2026-0001',
          createdBy: 'Fatima Abdi',
        },
        {
          id: 'sm_04',
          date: '2026-10-01T15:00:00.000Z',
          productId: 'prd_01',
          productName: 'Samsung Galaxy A55 5G 128GB',
          sku: 'SAM-A55-128',
          type: 'POS_SALE',
          quantityChange: -1,
          previousStock: 23,
          newStock: 22,
          unitCost: 280.00,
          referenceId: 'inv_02',
          reason: 'Sold via Invoice INV-2026-0002',
          createdBy: 'Fatima Abdi',
        },
      ],
      auditLogs: [
        {
          id: 'log_01',
          timestamp: '2026-09-01T08:00:00.000Z',
          action: 'INIT_SYSTEM',
          entity: 'Business',
          entityId: 'biz_01',
          userId: 'usr_admin',
          userName: 'Maqsuud Director',
          details: 'Initialized Maqsuud ICT — Smart POS & Enterprise Management System',
        },
        {
          id: 'log_02',
          timestamp: `${todayStr}T09:00:00.000Z`,
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: 'usr_admin',
          userId: 'usr_admin',
          userName: 'Maqsuud Director',
          details: 'Successful administrator authentication',
        },
      ],
      subscriptionPlans: [
        {
          id: 'plan_trial',
          name: '7-Day Free Trial',
          price: 0,
          period: '7 Days (24h × 7)',
          durationHours: 168,
          userLimit: 3,
          productLimit: 250,
          features: [
            'Full High-Speed POS & QR Checkout',
            '7-Day (168 Hours / 24h × 7) Full Evaluation',
            'Up to 250 Products & 3 Operator Accounts',
            'Customer Deyn & Rasiid Ledger Tracking',
            'Auto-Locks After 168 Hours Unless Upgraded',
          ],
          ussdCommand: '*712*611688269*0#',
          somtelUssdCommand: '*110*621688269*0#',
          salamBankAccount: '38524624',
          waafiPayNumbers: ['0611688269', '0621688269'],
        },
        {
          id: 'plan_monthly',
          name: 'Monthly Pro Plan',
          price: 30,
          period: 'Monthly',
          durationHours: 720,
          popular: true,
          userLimit: 15,
          productLimit: 10000,
          features: [
            'Unlimited High-Speed POS & Thermal Receipts',
            'Optical Camera & Hardware QR Barcode Scanner',
            'Customer & Supplier Deyn / Rasiid Ledgers',
            'Perpetual Weighted-Average COGS & Profit Reports',
            'Multi-User Role & Permission Access Control',
            'Export Branded PDF & Excel Financial Audits',
            '24/7 Priority WhatsApp & Phone Support',
          ],
          ussdCommand: '*712*611688269*30#',
          somtelUssdCommand: '*110*621688269*30#',
          salamBankAccount: '38524624',
          waafiPayNumbers: ['0611688269', '0621688269'],
        },
        {
          id: 'plan_annual',
          name: 'Annual Enterprise Plan',
          price: 360,
          period: 'Yearly',
          durationHours: 8760,
          userLimit: 999,
          productLimit: 999999,
          features: [
            'All Monthly Pro Features Included',
            '365-Day Uninterrupted Enterprise License',
            'Unlimited Products, Categories & Operator Roles',
            'Full Multi-Currency Ledger (USD, SOS, SLSH, KES, ETB)',
            'Automated Database Backups & Cloud Sync',
            'Dedicated Maqsuud ICT Account Engineer',
            'VIP Hardware & Thermal Printer Integration',
          ],
          ussdCommand: '*712*611688269*360#',
          somtelUssdCommand: '*110*621688269*360#',
          salamBankAccount: '38524624',
          waafiPayNumbers: ['0611688269', '0621688269'],
        },
      ],
    };

    if (process.env.NODE_ENV === 'production') {
      defaults.customers = [];
      defaults.customerLedger = [];
      defaults.customerPayments = [];
      defaults.suppliers = [];
      defaults.supplierLedger = [];
      defaults.supplierPayments = [];
      defaults.products = [];
      defaults.categories = [];
      defaults.brands = [];
      defaults.invoices = [];
      defaults.purchases = [];
      defaults.stockMovements = [];
      defaults.auditLogs = [];
    }

    return defaults;
  }

  private mergeAndNormalizeData(parsed: any): IDatabaseSchema {
    const defaults = this.getDefaultData();
    const defaultImgMap = new Map<string, string>();
    defaults.products.forEach((dp) => {
      if (dp.image) {
        defaultImgMap.set(dp.id, dp.image);
        defaultImgMap.set(dp.sku, dp.image);
      }
    });

    const mergedProducts = Array.isArray(parsed?.products)
      ? parsed.products.map((p: IProduct) => ({
          ...p,
          image:
            p.image ||
            defaultImgMap.get(p.id) ||
            defaultImgMap.get(p.sku) ||
            'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
        }))
      : defaults.products;

    const legacyPlaceholderHash = '$2a$10$wT8K8Ueqx1vj5aLgXQ3HSu3W/659BqKq/r8yv5X5iGkY6mO5v51qW';
    const mergedUsers =
      process.env.NODE_ENV !== 'production' && Array.isArray(parsed?.users)
        ? parsed.users.map((u: IUser) =>
            u.passwordHash === legacyPlaceholderHash
              ? { ...u, passwordHash: bcrypt.hashSync('admin123', 10) }
              : u
          )
        : parsed?.users || defaults.users;

    return {
      ...defaults,
      ...parsed,
      users: mergedUsers,
      products: mergedProducts,
      subscriptionPlans: defaults.subscriptionPlans,
    };
  }

  private createTiDBPool(): Pool | null {
    const tidbUrl = (process.env.TIDB_URL || '').trim();
    const tidbHost = (process.env.TIDB_HOST || '').trim();

    if (tidbUrl && !tidbUrl.includes('your_password')) {
      try {
        const parsedUrl = new URL(tidbUrl);
        return mysql.createPool({
          host: parsedUrl.hostname,
          port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 4000,
          user: decodeURIComponent(parsedUrl.username),
          password: decodeURIComponent(parsedUrl.password),
          database: parsedUrl.pathname.replace(/^\//, '') || 'test',
          ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
          },
          waitForConnections: true,
          connectionLimit: 5,
          queueLimit: 0,
        });
      } catch (err) {
        console.error('[TiDB Cloud] Invalid TIDB_URL format:', err);
        return null;
      }
    }

    if (
      tidbHost &&
      process.env.TIDB_USER &&
      process.env.TIDB_PASSWORD &&
      !tidbHost.includes('your_')
    ) {
      return mysql.createPool({
        host: tidbHost,
        port: parseInt(process.env.TIDB_PORT || '4000', 10),
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE || 'test',
        ssl: {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true,
        },
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
      });
    }

    return null;
  }

  public async initFromCloud(): Promise<void> {
    this.pool = this.createTiDBPool();
    if (!this.pool) {
      this.cloudConnected = false;
      return;
    }

    try {
      // 1. Auto-create maqsuud_pos_store table on startup
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS maqsuud_pos_store (
          id VARCHAR(64) PRIMARY KEY,
          payload LONGTEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      // 2. Query existing cloud store payload
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT payload FROM maqsuud_pos_store WHERE id = 'main_store' LIMIT 1`
      );

      if (Array.isArray(rows) && rows.length > 0 && rows[0].payload) {
        const cloudParsed = JSON.parse(rows[0].payload);
        this.data = this.mergeAndNormalizeData(cloudParsed);
        this.enforceExpiryCheck();
        this.saveLocalOnly();
        this.cloudConnected = true;
        console.log('☁️  [TiDB Cloud] Hydrated Maqsuud ICT POS state from TiDB Cloud (main_store).');
      } else {
        // Seed initial default/local data into TiDB Cloud
        const payloadStr = JSON.stringify(this.data);
        await this.pool.execute(
          `INSERT INTO maqsuud_pos_store (id, payload) VALUES ('main_store', ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
          [payloadStr]
        );
        this.cloudConnected = true;
        console.log('☁️  [TiDB Cloud] Initialized maqsuud_pos_store table with initial store data.');
      }
    } catch (err: any) {
      this.cloudConnected = false;
      console.error('[TiDB Cloud] Connection or hydration failed, using Local Disk Fallback:', err?.message || err);
    }
  }

  public isCloudConnected(): boolean {
    return this.cloudConnected;
  }

  public getDatabaseStatus(): 'TiDB Cloud Connected' | 'Local Disk Fallback' {
    return this.cloudConnected ? 'TiDB Cloud Connected' : 'Local Disk Fallback';
  }

  private enforceExpiryCheck(): void {
    if (!this.data?.business) return;
    if (!this.data.business.trialStartedAt) {
      this.data.business.trialStartedAt = new Date().toISOString();
    }

    let expiryMs: number;
    if (this.data.business.subscriptionStatus === 'active' && this.data.business.subscriptionExpiry) {
      expiryMs = new Date(this.data.business.subscriptionExpiry).getTime();
    } else {
      const trialStartMs = new Date(this.data.business.trialStartedAt).getTime();
      expiryMs = trialStartMs + 7 * 24 * 60 * 60 * 1000;
      this.data.business.subscriptionExpiry = new Date(expiryMs).toISOString();
    }

    if (!isNaN(expiryMs) && expiryMs <= Date.now()) {
      if (this.data.business.subscriptionStatus !== 'expired') {
        this.data.business.subscriptionStatus = 'expired';
        this.save();
      }
    }
  }

  private saveLocalOnly(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB to local file:', err);
    }
  }

  private load(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = this.mergeAndNormalizeData(parsed);
        this.enforceExpiryCheck();
        this.saveLocalOnly();
      } else {
        this.saveLocalOnly();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error loading DB from file, using in-memory default:', err);
      this.data = this.getDefaultData();
    }
  }

  public save(): void {
    // 1. Always write synchronously to local disk (.data/shop_db.json)
    this.saveLocalOnly();

    // 2. Asynchronously persist to TiDB Cloud when configured
    if (this.pool) {
      const payloadStr = JSON.stringify(this.data);
      this.pool
        .execute(
          `INSERT INTO maqsuud_pos_store (id, payload) VALUES ('main_store', ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
          [payloadStr]
        )
        .then(() => {
          this.cloudConnected = true;
        })
        .catch((err) => {
          this.cloudConnected = false;
          console.error('[TiDB Cloud] Async cloud save error:', err?.message || err);
        });
    }
  }

  public get(): IDatabaseSchema {
    this.enforceExpiryCheck();
    return this.data;
  }

  public update(updater: (db: IDatabaseSchema) => void): IDatabaseSchema {
    updater(this.data);
    this.enforceExpiryCheck();
    this.save();
    return this.data;
  }
}

export const dbStore = new DatabaseStore();
