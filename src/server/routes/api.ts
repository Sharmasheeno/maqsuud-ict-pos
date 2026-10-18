import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbStore, IInvoice, IStockMovement, ICustomerLedgerEntry, ISupplierLedgerEntry, ICustomerPayment, ISupplierPayment } from '../db/store';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-insecure-secret-change-before-deploy';

// Helper for generating tokens
function generateToken(user: any) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Auth Middleware
export function authMiddleware(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If testing or offline dev without header, allow or reject
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

function requireAdmin(req: Request, res: Response): boolean {
  if ((req as any).user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Administrator access required.' });
    return false;
  }
  return true;
}

function invoiceItemRevenueAfterInvoiceDiscount(invoice: IInvoice, item: IInvoice['items'][number]): number {
  const lineRevenue = Math.max(0, Number(item.total) || 0);
  const invoiceLinesRevenue = invoice.items.reduce(
    (sum, line) => sum + Math.max(0, Number(line.total) || 0),
    0
  );
  const invoiceDiscount = Math.min(invoiceLinesRevenue, Math.max(0, Number(invoice.discountTotal) || 0));
  const allocatedDiscount = invoiceLinesRevenue > 0 ? invoiceDiscount * (lineRevenue / invoiceLinesRevenue) : 0;
  return Math.max(0, lineRevenue - allocatedDiscount);
}

// ----------------------------------------------------
// 1. AUTH & USER PROFILE ENDPOINTS
// ----------------------------------------------------
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const db = dbStore.get();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
  }

  // Check password (support both hashed and direct match for safety)
  const isMatch = Boolean(user.passwordHash) && bcrypt.compareSync(password, user.passwordHash);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }

  const token = generateToken(user);
  const roleObj = db.roles.find((r) => r.id === `role_${user.role}` || r.name.toLowerCase() === user.role.toLowerCase());

  // Log login audit
  dbStore.update((d) => {
    d.auditLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      userName: user.name,
      details: `User logged in from web client (${user.role})`,
    });
  });

  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      permissions: roleObj ? roleObj.permissions : ['pos_access'],
      biometricEnabled: user.biometricEnabled,
    },
  });
});

// Biometric Quick Authentication
router.post('/auth/biometric', (req, res) => {
  return res.status(501).json({ success: false, message: 'Biometric sign-in is not configured.' });
});

router.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No active session' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const db = dbStore.get();
    const user = db.users.find((u) => u.id === decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not active or found' });
    }
    const roleObj = db.roles.find((r) => r.id === `role_${user.role}` || r.name.toLowerCase() === user.role.toLowerCase());

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        biometricEnabled: user.biometricEnabled,
        permissions: roleObj ? roleObj.permissions : ['pos_access'],
      },
    });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

router.get('/settings/business', (req, res) => {
  return res.json({ success: true, business: dbStore.get().business });
});

router.use(authMiddleware);

router.delete('/admin/store-data', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (req.body?.confirmation !== 'DELETE ALL BUSINESS DATA') {
    return res.status(400).json({ success: false, message: 'Confirmation phrase is required.' });
  }

  const adminId = (req as any).user.id;
  dbStore.update((d) => {
    // Keep the signed-in administrator and configuration so the app remains accessible.
    d.users = d.users.filter((user) => user.id === adminId);
    d.customers = [];
    d.customerLedger = [];
    d.customerPayments = [];
    d.suppliers = [];
    d.supplierLedger = [];
    d.supplierPayments = [];
    d.products = [];
    d.categories = [];
    d.brands = [];
    d.invoices = [];
    d.purchases = [];
    d.stockMovements = [];
    d.auditLogs = [];
  });

  try {
    await dbStore.flushCloud();
  } catch (error: any) {
    console.error('[Admin data reset] TiDB persistence failed:', error?.message || error);
    return res.status(503).json({ success: false, message: 'The reset could not be confirmed in TiDB Cloud. Contact support before retrying.' });
  }

  return res.json({ success: true, message: 'Business records cleared.' });
});

router.put('/auth/profile', (req, res) => {
  const { name, phone } = req.body;
  const id = (req as any).user.id;
  const db = dbStore.update((d) => {
    const user = d.users.find((u) => u.id === id);
    if (user) {
      if (name) user.name = name;
      if (phone) user.phone = phone;
    }
  });
  return res.json({ success: true, message: 'Profile updated successfully' });
});

router.post('/auth/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user.id;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  let success = false;
  dbStore.update((d) => {
    const user = d.users.find((u) => u.id === userId);
    if (user) {
      if (!bcrypt.compareSync(currentPassword || '', user.passwordHash)) return;
      user.passwordHash = bcrypt.hashSync(newPassword, 12);
      success = true;
      d.auditLogs.unshift({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'PASSWORD_CHANGE',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
        userName: user.name,
        details: 'User password changed successfully',
      });
    }
  });

  if (success) {
    return res.json({ success: true, message: 'Password changed successfully. Please keep your credentials secure.' });
  }
  return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
});

router.post('/auth/deactivate', (req, res) => {
  const userId = (req as any).user.id;
  let success = false;
  dbStore.update((d) => {
    const user = d.users.find((u) => u.id === userId);
    if (user) {
      user.isActive = false;
      success = true;
      d.auditLogs.unshift({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'ACCOUNT_DEACTIVATED',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
        userName: user.name,
        details: 'Account deactivated by user request. Financial history preserved.',
      });
    }
  });

  return res.json({ success, message: 'Account deactivated successfully. Contact admin if you need restoration.' });
});

// ----------------------------------------------------
// 2. DASHBOARD REAL-TIME METRICS & CALCULABLE CHARTS
// ----------------------------------------------------
router.get('/dashboard', (req, res) => {
  const db = dbStore.get();
  const todayStr = new Date().toISOString().split('T')[0];
  const allowedPeriods = ['day', 'week', 'month', 'year'];
  const period = allowedPeriods.includes(String(req.query.period)) ? String(req.query.period) : 'week';

  // Calculate totals from actual document collections
  const activeInvoices = db.invoices.filter((invoice) => !invoice.isRefunded);
  const totalSales = activeInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalPurchases = db.purchases.reduce((sum, po) => sum + (po.totalCost || 0), 0);
  const totalUsers = db.users.filter((u) => u.isActive).length;
  const totalCustomers = db.customers.filter((c) => !c.isArchived).length;
  const totalSuppliers = db.suppliers.filter((s) => !s.isArchived).length;
  const totalProducts = db.products.filter((p) => !p.isArchived).length;

  // Debt calculations
  const customerDebts = db.customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  const supplierDebts = db.suppliers.reduce((sum, s) => sum + (s.currentBalance > 0 ? s.currentBalance : 0), 0);
  const totalCustomerCredit = db.customers.reduce((sum, c) => sum + (c.totalCredit || 0), 0);
  const totalCustomerPayments = db.customerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalSupplierPayments = db.supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Inventory valuation: sum of (purchaseCost * stock)
  const totalInventoryValue = db.products.reduce((sum, p) => sum + (!p.isArchived ? (p.purchaseCost * p.stock) : 0), 0);

  // Today's Revenue and Profit
  const todayInvoices = activeInvoices.filter((inv) => inv.date && inv.date.startsWith(todayStr));
  const todayRevenue = todayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  // Profit uses each invoice line after allocating invoice-level discounts.
  let todayProfit = 0;
  todayInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      todayProfit += invoiceItemRevenueAfterInvoiceDiscount(inv, item) - item.unitCost * item.quantity;
    });
  });

  // Build real hourly, daily, or monthly buckets for the selected chart period.
  const bucketCount = period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? 30 : 12;
  const firstBucket = new Date();
  if (period === 'day') {
    firstBucket.setUTCMinutes(0, 0, 0);
    firstBucket.setUTCHours(firstBucket.getUTCHours() - (bucketCount - 1));
  } else if (period === 'year') {
    firstBucket.setUTCDate(1);
    firstBucket.setUTCHours(0, 0, 0, 0);
    firstBucket.setUTCMonth(firstBucket.getUTCMonth() - (bucketCount - 1));
  } else {
    firstBucket.setUTCHours(0, 0, 0, 0);
    firstBucket.setUTCDate(firstBucket.getUTCDate() - (bucketCount - 1));
  }

  const salesByPeriod: Record<string, { date: string; rawDate: string; sales: number; profit: number; count: number }> = {};
  const keyForDate = (date: Date) =>
    period === 'day' ? date.toISOString().slice(0, 13) : period === 'year' ? date.toISOString().slice(0, 7) : date.toISOString().slice(0, 10);

  for (let index = 0; index < bucketCount; index += 1) {
    const bucketDate = new Date(firstBucket);
    if (period === 'day') bucketDate.setUTCHours(bucketDate.getUTCHours() + index);
    else if (period === 'year') bucketDate.setUTCMonth(bucketDate.getUTCMonth() + index);
    else bucketDate.setUTCDate(bucketDate.getUTCDate() + index);
    const rawDate = keyForDate(bucketDate);
    const date = period === 'day'
      ? bucketDate.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'UTC' })
      : period === 'year'
        ? bucketDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
        : bucketDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    salesByPeriod[rawDate] = { date, rawDate, sales: 0, profit: 0, count: 0 };
  }

  // Best-selling products in the selected period, excluding refunded sales.
  const productSalesMap: { [id: string]: { name: string; quantity: number; revenue: number } } = {};
  activeInvoices.forEach((inv) => {
    const dateKey = typeof inv.date === 'string'
      ? period === 'day' ? inv.date.slice(0, 13) : period === 'year' ? inv.date.slice(0, 7) : inv.date.slice(0, 10)
      : '';
    const bucket = salesByPeriod[dateKey];
    if (!bucket) return;
    const profit = inv.items.reduce(
      (sum, item) => sum + invoiceItemRevenueAfterInvoiceDiscount(inv, item) - item.unitCost * item.quantity,
      0
    );
    bucket.sales += inv.grandTotal || 0;
    bucket.profit += profit;
    bucket.count += 1;

    inv.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += invoiceItemRevenueAfterInvoiceDiscount(inv, item);
    });
  });

  const salesTrend = Object.values(salesByPeriod).map((bucket) => ({
    ...bucket,
    sales: Number(bucket.sales.toFixed(2)),
    profit: Number(bucket.profit.toFixed(2)),
  }));

  const bestSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Low stock products
  const lowStockProducts = db.products
    .filter((p) => !p.isArchived && p.stock <= p.minStock)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      minStock: p.minStock,
      category: p.category,
    }));

  return res.json({
    success: true,
    metrics: {
      totalSales: Number(totalSales.toFixed(2)),
      totalPurchases: Number(totalPurchases.toFixed(2)),
      totalUsers,
      totalCustomers,
      totalSuppliers,
      totalProducts,
      customerDebts: Number(customerDebts.toFixed(2)),
      supplierDebts: Number(supplierDebts.toFixed(2)),
      totalCustomerCredit: Number(totalCustomerCredit.toFixed(2)),
      totalCustomerPayments: Number(totalCustomerPayments.toFixed(2)),
      totalSupplierPayments: Number(totalSupplierPayments.toFixed(2)),
      totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      todayRevenue: Number(todayRevenue.toFixed(2)),
      todayProfit: Number(todayProfit.toFixed(2)),
      todayInvoiceCount: todayInvoices.length,
      currency: db.business.currency,
      currencySymbol: db.business.currencySymbol,
    },
    charts: {
      salesTrend,
      bestSellingProducts,
      lowStockProducts,
    },
    recentActivity: {
      recentInvoices: db.invoices.slice(0, 5),
      recentCustomerPayments: db.customerPayments.slice(0, 5),
      recentSupplierPayments: db.supplierPayments.slice(0, 5),
      recentPurchases: db.purchases.slice(0, 5),
      recentlyAddedCustomers: db.customers.slice(0, 5),
      recentlyAddedSuppliers: db.suppliers.slice(0, 5),
    },
  });
});

// ----------------------------------------------------
// 3. PRODUCTS & CATEGORIES & QR ENDPOINTS
// ----------------------------------------------------
router.get('/products', (req, res) => {
  const db = dbStore.get();
  const search = ((req.query.search as string) || '').toLowerCase();
  const category = (req.query.category as string) || '';

  let list = db.products.filter((p) => !p.isArchived);

  if (search) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.qrCode.toLowerCase().includes(search) ||
        p.productId.toLowerCase().includes(search)
    );
  }

  if (category && category !== 'All') {
    list = list.filter((p) => p.category === category);
  }

  return res.json({ success: true, products: list });
});

router.get('/products/:id', (req, res) => {
  const db = dbStore.get();
  const product = db.products.find((p) => p.id === req.params.id || p.productId === req.params.id || p.qrCode === req.params.id || p.sku === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  return res.json({ success: true, product });
});

// Scan / Validate QR code directly
router.post('/qr/scan', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'QR Code is required' });
  }

  const cleanCode = code.trim();
  const db = dbStore.get();
  const product = db.products.find(
    (p) =>
      !p.isArchived &&
      (p.qrCode.toLowerCase() === cleanCode.toLowerCase() ||
        p.sku.toLowerCase() === cleanCode.toLowerCase() ||
        p.productId.toLowerCase() === cleanCode.toLowerCase())
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: `No product found matching code "${cleanCode}". Please verify label or add product.`,
    });
  }

  return res.json({
    success: true,
    product: {
      id: product.id,
      productId: product.productId,
      name: product.name,
      sku: product.sku,
      qrCode: product.qrCode,
      category: product.category,
      sellingPrice: product.sellingPrice,
      purchaseCost: product.purchaseCost,
      stock: product.stock,
      unit: product.unit,
      image: product.image,
      isAvailable: product.stock > 0,
    },
  });
});

router.post('/products', (req, res) => {
  const { name, sku, qrCode, category, brand, purchaseCost, sellingPrice, stock, minStock, unit, description, supplierId, image } = req.body;
  if (!name || sellingPrice === undefined || sellingPrice === '') {
    return res.status(400).json({ success: false, message: 'Product name and selling price are required.' });
  }

  const now = new Date().toISOString();
  const cleanSku = (sku || '').trim() || 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const cleanQr = (qrCode || '').trim() || cleanSku;
  const newProduct: any = {
    id: 'prd_' + Date.now(),
    productId: 'PRD-' + (1000 + Math.floor(Math.random() * 9000)),
    name,
    sku: cleanSku,
    qrCode: cleanQr,
    category: category || 'General',
    brand: brand || 'Generic',
    purchaseCost: parseFloat(purchaseCost) || 0,
    sellingPrice: parseFloat(sellingPrice) || 0,
    stock: parseInt(stock) || 0,
    minStock: parseInt(minStock) || 5,
    unit: unit || 'pcs',
    image: image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
    description: description || '',
    supplierId: supplierId || '',
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.update((d) => {
    d.products.unshift(newProduct);
    // Record initial stock movement
    if (newProduct.stock > 0) {
      d.stockMovements.unshift({
        id: 'sm_' + Date.now(),
        date: now,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'INITIAL',
        quantityChange: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        unitCost: newProduct.purchaseCost,
        reason: 'Initial Product Stock Addition',
        createdBy: 'Admin',
      });
    }
  });

  return res.json({ success: true, message: 'Product added successfully', product: newProduct });
});

router.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let updatedProduct: any = null;

  dbStore.update((d) => {
    const idx = d.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const prev = d.products[idx];
      const newStock = updates.stock !== undefined ? parseInt(updates.stock) : prev.stock;
      if (newStock !== prev.stock) {
        // Record stock adjustment movement
        const diff = newStock - prev.stock;
        d.stockMovements.unshift({
          id: 'sm_' + Date.now(),
          date: new Date().toISOString(),
          productId: prev.id,
          productName: prev.name,
          sku: prev.sku,
          type: 'ADJUSTMENT',
          quantityChange: diff,
          previousStock: prev.stock,
          newStock: newStock,
          unitCost: prev.purchaseCost,
          reason: 'Manual Stock Level Edit',
          createdBy: 'Admin',
        });
      }

      d.products[idx] = {
        ...prev,
        ...updates,
        purchaseCost: updates.purchaseCost !== undefined ? parseFloat(updates.purchaseCost) : prev.purchaseCost,
        sellingPrice: updates.sellingPrice !== undefined ? parseFloat(updates.sellingPrice) : prev.sellingPrice,
        minStock: updates.minStock !== undefined ? parseInt(updates.minStock) : prev.minStock,
        stock: newStock,
        updatedAt: new Date().toISOString(),
      };
      updatedProduct = d.products[idx];
    }
  });

  if (updatedProduct) {
    return res.json({ success: true, message: 'Product updated successfully', product: updatedProduct });
  }
  return res.status(404).json({ success: false, message: 'Product not found' });
});

router.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  let archived = false;
  dbStore.update((d) => {
    const p = d.products.find((item) => item.id === id);
    if (p && !p.isArchived) {
      p.isArchived = true;
      archived = true;
    }
  });
  if (!archived) {
    return res.status(404).json({ success: false, message: 'Product not found or already archived.' });
  }
  return res.json({ success: true, message: 'Product archived successfully' });
});

// Import Products from CSV / JSON
router.post('/products/import', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Valid items array required for import.' });
  }

  let importedCount = 0;
  const now = new Date().toISOString();

  dbStore.update((d) => {
    items.forEach((item: any) => {
      if (item.name && (item.sellingPrice || item.price)) {
        const p: any = {
          id: 'prd_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          productId: 'PRD-' + (1000 + Math.floor(Math.random() * 9000)),
          name: item.name,
          sku: item.sku || 'SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          qrCode: item.qrCode || 'QR-' + item.name.slice(0, 5).toUpperCase() + '-' + Math.floor(Math.random() * 10000),
          category: item.category || 'General',
          brand: item.brand || 'Generic',
          purchaseCost: parseFloat(item.purchaseCost || item.cost) || 0,
          sellingPrice: parseFloat(item.sellingPrice || item.price) || 0,
          stock: parseInt(item.stock || item.quantity) || 0,
          minStock: parseInt(item.minStock) || 5,
          unit: item.unit || 'pcs',
          description: item.description || '',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        };
        d.products.unshift(p);
        importedCount++;
      }
    });
  });

  return res.json({ success: true, message: `Successfully imported ${importedCount} products.` });
});

router.get('/categories', (req, res) => {
  return res.json({ success: true, categories: dbStore.get().categories });
});

router.post('/categories', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  const cat = { id: 'cat_' + Date.now(), name, description: description || '' };
  dbStore.update((d) => d.categories.push(cat));
  return res.json({ success: true, category: cat });
});

router.put('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }
  let updated: any = null;
  dbStore.update((d) => {
    const c = d.categories.find((cat) => cat.id === id);
    if (c) {
      const oldName = c.name;
      c.name = name.trim();
      if (description !== undefined) c.description = description;
      if (oldName !== c.name) {
        d.products.forEach((p) => {
          if (p.category === oldName) {
            p.category = c.name;
          }
        });
      }
      updated = c;
    }
  });
  if (updated) {
    return res.json({ success: true, message: 'Category updated successfully', category: updated });
  }
  return res.status(404).json({ success: false, message: 'Category not found' });
});

router.delete('/categories/:id', (req, res) => {
  const { id } = req.params;
  let deleted = false;
  dbStore.update((d) => {
    const idx = d.categories.findIndex((cat) => cat.id === id);
    if (idx !== -1) {
      d.categories.splice(idx, 1);
      deleted = true;
    }
  });
  if (deleted) {
    return res.json({ success: true, message: 'Category deleted successfully' });
  }
  return res.status(404).json({ success: false, message: 'Category not found' });
});

// ----------------------------------------------------
// 4. CUSTOMERS & CUSTOMER LEDGER & DEBTS
// ----------------------------------------------------
router.get('/customers', (req, res) => {
  const db = dbStore.get();
  const search = ((req.query.search as string) || '').toLowerCase();
  let list = db.customers.filter((c) => !c.isArchived);

  if (search) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(search) ||
        c.customerId.toLowerCase().includes(search) ||
        (c.email && c.email.toLowerCase().includes(search))
    );
  }

  return res.json({ success: true, customers: list });
});

router.get('/customers/:id', (req, res) => {
  const db = dbStore.get();
  const customer = db.customers.find((c) => c.id === req.params.id || c.customerId === req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  // Get their ledger and invoices and payments
  const ledger = db.customerLedger.filter((l) => l.customerId === customer.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const invoices = db.invoices.filter((inv) => inv.customerId === customer.id);
  const payments = db.customerPayments.filter((p) => p.customerId === customer.id);

  return res.json({
    success: true,
    customer,
    ledger,
    invoices,
    payments,
  });
});

router.post('/customers', (req, res) => {
  const { name, phone, email, address, openingBalance, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Customer name and phone number are required.' });
  }

  const now = new Date().toISOString();
  const initialBalance = parseFloat(openingBalance) || 0;
  const newCust: any = {
    id: 'cust_' + Date.now(),
    customerId: 'CUST-' + String(dbStore.get().customers.length + 1).padStart(3, '0'),
    name,
    phone,
    email: email || '',
    address: address || '',
    openingBalance: initialBalance,
    totalCredit: 0,
    totalPayments: 0,
    currentBalance: initialBalance,
    notes: notes || '',
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.update((d) => {
    d.customers.unshift(newCust);
    if (initialBalance !== 0) {
      d.customerLedger.unshift({
        id: 'cld_' + Date.now(),
        customerId: newCust.id,
        date: now,
        type: 'OPENING_BALANCE',
        description: 'Customer opening balance balance recorded',
        debit: initialBalance > 0 ? initialBalance : 0,
        credit: initialBalance < 0 ? Math.abs(initialBalance) : 0,
        previousBalance: 0,
        newBalance: initialBalance,
        createdBy: 'Admin',
      });
    }
  });

  return res.json({ success: true, message: 'Customer created successfully', customer: newCust });
});

router.put('/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, notes, openingBalance, currentBalance } = req.body;
  let updated: any = null;

  dbStore.update((d) => {
    const c = d.customers.find((cust) => cust.id === id);
    if (c) {
      if (name) c.name = name;
      if (phone) c.phone = phone;
      if (email !== undefined) c.email = email;
      if (address !== undefined) c.address = address;
      if (notes !== undefined) c.notes = notes;
      if (openingBalance !== undefined && !isNaN(parseFloat(openingBalance))) {
        const newOpen = parseFloat(openingBalance);
        if (newOpen !== c.openingBalance) {
          const diff = newOpen - c.openingBalance;
          const prevBal = c.currentBalance;
          c.openingBalance = newOpen;
          c.currentBalance = parseFloat((c.currentBalance + diff).toFixed(2));
          d.customerLedger.unshift({
            id: 'cld_' + Date.now(),
            customerId: c.id,
            date: new Date().toISOString(),
            type: 'OPENING_BALANCE',
            description: 'Admin adjusted customer opening balance',
            debit: diff > 0 ? diff : 0,
            credit: diff < 0 ? Math.abs(diff) : 0,
            previousBalance: prevBal,
            newBalance: c.currentBalance,
            createdBy: (req as any).user?.name || 'Admin',
          });
        }
      }
      if (currentBalance !== undefined && !isNaN(parseFloat(currentBalance))) {
        c.currentBalance = parseFloat(currentBalance);
      }
      c.updatedAt = new Date().toISOString();
      updated = c;
    }
  });

  if (updated) {
    return res.json({ success: true, message: 'Customer updated successfully', customer: updated });
  }
  return res.status(404).json({ success: false, message: 'Customer not found' });
});

router.delete('/customers/:id', (req, res) => {
  const { id } = req.params;
  dbStore.update((d) => {
    const c = d.customers.find((item) => item.id === id);
    if (c) c.isArchived = true;
  });
  return res.json({ success: true, message: 'Customer deleted successfully' });
});

// Record Customer Payment (Rasiid)
router.post('/customer-payments', (req, res) => {
  const { customerId, amount, paymentMethod, reference, note, invoiceId } = req.body;
  const payAmount = parseFloat(amount);
  if (!customerId || !payAmount || payAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid customer and payment amount are required.' });
  }

  const db = dbStore.get();
  const customer = db.customers.find((c) => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  const now = new Date().toISOString();
  const prevBal = customer.currentBalance;
  const newBal = prevBal - payAmount;
  const payId = 'pay_' + Date.now();
  const payNumber = 'PAY-2026-' + String(db.customerPayments.length + 1).padStart(4, '0');

  const newPayment: ICustomerPayment = {
    id: payId,
    paymentNumber: payNumber,
    customerId: customer.id,
    customerName: customer.name,
    amount: payAmount,
    date: now,
    paymentMethod: paymentMethod || 'Cash',
    reference: reference || '',
    invoiceAllocations: invoiceId ? [{ invoiceId, invoiceNumber: invoiceId, amountAllocated: payAmount }] : [],
    previousBalance: prevBal,
    newBalance: newBal,
    note: note || 'Customer debt payment receipt',
    createdBy: 'Mustafa Jama',
    createdAt: now,
  };

  dbStore.update((d) => {
    d.customerPayments.unshift(newPayment);

    // Update customer balances
    const c = d.customers.find((item) => item.id === customerId);
    if (c) {
      c.totalPayments += payAmount;
      c.currentBalance = newBal;
      c.updatedAt = now;
    }

    // Insert immutable ledger entry
    d.customerLedger.unshift({
      id: 'cld_' + Date.now(),
      customerId: customer.id,
      date: now,
      type: 'PAYMENT',
      description: `Payment ${payNumber} via ${paymentMethod || 'Cash'}${reference ? ` (Ref: ${reference})` : ''}`,
      debit: 0,
      credit: payAmount,
      previousBalance: prevBal,
      newBalance: newBal,
      referenceId: payId,
      paymentMethod: paymentMethod || 'Cash',
      createdBy: 'Accountant',
    });

    // If allocated to invoice, update invoice amountPaid & status
    if (invoiceId) {
      const inv = d.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
      if (inv) {
        inv.amountPaid += payAmount;
        inv.balanceDue = Math.max(0, inv.grandTotal - inv.amountPaid);
        if (inv.balanceDue <= 0.01) {
          inv.paymentStatus = 'PAID';
        } else {
          inv.paymentStatus = 'PARTIAL';
        }
      }
    }
  });

  return res.json({
    success: true,
    message: `Payment of $${payAmount.toFixed(2)} recorded successfully. New balance: $${newBal.toFixed(2)}`,
    payment: newPayment,
  });
});

// ----------------------------------------------------
// 5. SUPPLIERS & SUPPLIER LEDGER & DEBTS
// ----------------------------------------------------
router.get('/suppliers', (req, res) => {
  const db = dbStore.get();
  const search = ((req.query.search as string) || '').toLowerCase();
  let list = db.suppliers.filter((s) => !s.isArchived);

  if (search) {
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.contactPerson.toLowerCase().includes(search) ||
        s.phone.includes(search) ||
        s.supplierId.toLowerCase().includes(search)
    );
  }

  return res.json({ success: true, suppliers: list });
});

router.get('/suppliers/:id', (req, res) => {
  const db = dbStore.get();
  const supplier = db.suppliers.find((s) => s.id === req.params.id || s.supplierId === req.params.id);
  if (!supplier) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }

  const ledger = db.supplierLedger.filter((l) => l.supplierId === supplier.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const purchases = db.purchases.filter((p) => p.supplierId === supplier.id);
  const payments = db.supplierPayments.filter((p) => p.supplierId === supplier.id);

  return res.json({
    success: true,
    supplier,
    ledger,
    purchases,
    payments,
  });
});

router.post('/suppliers', (req, res) => {
  const { name, contactPerson, phone, email, address, openingBalance, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Supplier name and phone are required.' });
  }

  const now = new Date().toISOString();
  const initialBalance = parseFloat(openingBalance) || 0;
  const newSupp: any = {
    id: 'sup_' + Date.now(),
    supplierId: 'SUPP-' + String(dbStore.get().suppliers.length + 1).padStart(3, '0'),
    name,
    contactPerson: contactPerson || '',
    phone,
    email: email || '',
    address: address || '',
    openingBalance: initialBalance,
    totalPurchases: 0,
    totalPayments: 0,
    currentBalance: initialBalance,
    notes: notes || '',
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.update((d) => {
    d.suppliers.unshift(newSupp);
    if (initialBalance !== 0) {
      d.supplierLedger.unshift({
        id: 'sld_' + Date.now(),
        supplierId: newSupp.id,
        date: now,
        type: 'OPENING_BALANCE',
        description: 'Supplier opening debt balance recorded',
        debit: 0,
        credit: initialBalance,
        previousBalance: 0,
        newBalance: initialBalance,
        createdBy: 'Admin',
      });
    }
  });

  return res.json({ success: true, message: 'Supplier added successfully', supplier: newSupp });
});

router.put('/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, phone, email, address, notes, openingBalance } = req.body;
  let updated: any = null;

  dbStore.update((d) => {
    const s = d.suppliers.find((supp) => supp.id === id);
    if (s) {
      if (name) s.name = name;
      if (contactPerson !== undefined) s.contactPerson = contactPerson;
      if (phone) s.phone = phone;
      if (email !== undefined) s.email = email;
      if (address !== undefined) s.address = address;
      if (notes !== undefined) s.notes = notes;
      if (openingBalance !== undefined && !isNaN(parseFloat(openingBalance))) {
        const newOpen = parseFloat(openingBalance);
        if (newOpen !== s.openingBalance) {
          const diff = newOpen - s.openingBalance;
          s.openingBalance = newOpen;
          s.currentBalance = parseFloat((s.currentBalance + diff).toFixed(2));
        }
      }
      s.updatedAt = new Date().toISOString();
      updated = s;
    }
  });

  if (updated) {
    return res.json({ success: true, message: 'Supplier updated successfully', supplier: updated });
  }
  return res.status(404).json({ success: false, message: 'Supplier not found' });
});

router.delete('/suppliers/:id', (req, res) => {
  const { id } = req.params;
  dbStore.update((d) => {
    const s = d.suppliers.find((item) => item.id === id);
    if (s) s.isArchived = true;
  });
  return res.json({ success: true, message: 'Supplier deleted successfully' });
});

// Record Supplier Payment
router.post('/supplier-payments', (req, res) => {
  const { supplierId, amount, paymentMethod, reference, note, purchaseId } = req.body;
  const payAmount = parseFloat(amount);
  if (!supplierId || !payAmount || payAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid supplier and payment amount required.' });
  }

  const db = dbStore.get();
  const supplier = db.suppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }

  const now = new Date().toISOString();
  const prevBal = supplier.currentBalance;
  const newBal = prevBal - payAmount;
  const payId = 'spay_' + Date.now();
  const payNumber = 'SPAY-2026-' + String(db.supplierPayments.length + 1).padStart(4, '0');

  const newPayment: ISupplierPayment = {
    id: payId,
    paymentNumber: payNumber,
    supplierId: supplier.id,
    supplierName: supplier.name,
    amount: payAmount,
    date: now,
    paymentMethod: paymentMethod || 'Bank Transfer',
    reference: reference || '',
    purchaseAllocations: purchaseId ? [{ purchaseId, purchaseNumber: purchaseId, amountAllocated: payAmount }] : [],
    previousBalance: prevBal,
    newBalance: newBal,
    note: note || 'Supplier payment voucher',
    createdBy: 'Accountant',
    createdAt: now,
  };

  dbStore.update((d) => {
    d.supplierPayments.unshift(newPayment);

    const s = d.suppliers.find((item) => item.id === supplierId);
    if (s) {
      s.totalPayments += payAmount;
      s.currentBalance = newBal;
      s.updatedAt = now;
    }

    d.supplierLedger.unshift({
      id: 'sld_' + Date.now(),
      supplierId: supplier.id,
      date: now,
      type: 'PAYMENT',
      description: `Supplier payment ${payNumber} via ${paymentMethod || 'Bank'}`,
      debit: payAmount,
      credit: 0,
      previousBalance: prevBal,
      newBalance: newBal,
      referenceId: payId,
      paymentMethod: paymentMethod || 'Bank',
      createdBy: 'Accountant',
    });

    if (purchaseId) {
      const po = d.purchases.find((p) => p.id === purchaseId || p.purchaseNumber === purchaseId);
      if (po) {
        po.amountPaid += payAmount;
        po.balanceDue = Math.max(0, po.totalCost - po.amountPaid);
        po.paymentStatus = po.balanceDue <= 0.01 ? 'PAID' : 'PARTIAL';
      }
    }
  });

  return res.json({
    success: true,
    message: `Payment of $${payAmount.toFixed(2)} recorded to supplier. Remaining debt: $${newBal.toFixed(2)}`,
    payment: newPayment,
  });
});

// ----------------------------------------------------
// 6. POS CHECKOUT & INVOICES & STOCK TRANSACTIONS
// ----------------------------------------------------
router.post('/pos/checkout', (req, res) => {
  const {
    items,
    customerId,
    customerName,
    customerPhone,
    paymentMethod,
    saleType,
    cashReceived,
    discountTotal,
    taxEnabled,
    insuranceEnabled,
    notes,
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart cannot be empty.' });
  }

  const db = dbStore.get();

  // Concurrency check and stock verification
  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ success: false, message: `Product "${item.name}" is no longer available in inventory.` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`,
      });
    }
  }

  // Calculate totals reliably on server
  let subtotal = 0;
  const verifiedItems = items.map((item: any) => {
    const product = db.products.find((p) => p.id === item.productId)!;
    const unitPrice = parseFloat(product.sellingPrice as any);
    const unitCost = parseFloat(product.purchaseCost as any);
    const qty = parseInt(item.quantity);
    const itemDiscount = parseFloat(item.discount || 0);
    const itemTotal = unitPrice * qty - itemDiscount;
    subtotal += unitPrice * qty;

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      qrCode: product.qrCode,
      unitCost,
      unitPrice,
      quantity: qty,
      subtotal: unitPrice * qty,
      discount: itemDiscount,
      total: itemTotal,
    };
  });

  const discTotal = parseFloat(discountTotal) || 0;
  const effectiveTaxPct =
    req.body.customTaxRate !== undefined && !isNaN(parseFloat(req.body.customTaxRate))
      ? parseFloat(req.body.customTaxRate)
      : db.business.taxRate;
  const taxRate = taxEnabled ? effectiveTaxPct / 100 : 0;
  const insuranceRate = insuranceEnabled ? db.business.insuranceRate / 100 : 0;

  const taxableAmount = Math.max(0, subtotal - discTotal);
  const taxTotal = parseFloat((taxableAmount * taxRate).toFixed(2));
  const insuranceTotal = parseFloat((taxableAmount * insuranceRate).toFixed(2));
  const grandTotal = parseFloat((taxableAmount + taxTotal + insuranceTotal).toFixed(2));

  const isCredit = saleType === 'CREDIT';
  const hasExplicitCashReceived =
    cashReceived !== undefined &&
    cashReceived !== null &&
    String(cashReceived).trim() !== '' &&
    !isNaN(Number(cashReceived));

  let amountPaid = 0;
  let balanceDue = grandTotal;
  let cashChange = 0;
  let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';

  if (!isCredit) {
    const cashRec = hasExplicitCashReceived ? Math.max(0, Number(cashReceived)) : grandTotal;
    amountPaid = parseFloat(Math.min(grandTotal, cashRec).toFixed(2));
    cashChange = parseFloat(Math.max(0, cashRec - grandTotal).toFixed(2));
    balanceDue = parseFloat(Math.max(0, grandTotal - amountPaid).toFixed(2));
    paymentStatus = balanceDue <= 0.01 ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
  } else {
    // If credit sale has initial deposit / recorded amount
    const deposit = hasExplicitCashReceived ? Math.max(0, Number(cashReceived)) : 0;
    amountPaid = parseFloat(Math.min(grandTotal, deposit).toFixed(2));
    balanceDue = parseFloat(Math.max(0, grandTotal - amountPaid).toFixed(2));
    paymentStatus = balanceDue <= 0.01 ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
  }

  const now = new Date().toISOString();
  const invoiceNumber = 'INV-2026-' + String(db.invoices.length + 1).padStart(4, '0');
  const invoiceId = 'inv_' + Date.now();

  const newInvoice: IInvoice = {
    id: invoiceId,
    invoiceNumber,
    customerId: customerId || undefined,
    customerName: customerName || 'Walk-in Customer',
    customerPhone: customerPhone || undefined,
    cashierId: 'usr_cashier',
    cashierName: 'Fatima Abdi',
    items: verifiedItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountTotal: discTotal,
    taxTotal,
    insuranceTotal,
    grandTotal,
    amountPaid,
    balanceDue,
    paymentStatus,
    paymentMethod: paymentMethod || (isCredit ? 'Credit' : 'Cash'),
    saleType: isCredit ? 'CREDIT' : 'CASH',
    cashReceived: parseFloat(cashReceived) || undefined,
    cashChange: cashChange > 0 ? parseFloat(cashChange.toFixed(2)) : 0,
    date: now,
    notes: notes || '',
    isPOS: req.body.invoiceMode !== 'generated',
    createdAt: now,
  };

  // Perform multi-collection transactional update
  dbStore.update((d) => {
    // 1. Add invoice
    d.invoices.unshift(newInvoice);

    // 2. Reduce inventory stock & record stock movement for each item
    for (const item of verifiedItems) {
      const p = d.products.find((prod) => prod.id === item.productId);
      if (p) {
        const prevStock = p.stock;
        p.stock = Math.max(0, p.stock - item.quantity);
        p.updatedAt = now;

        d.stockMovements.unshift({
          id: 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          date: now,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          type: 'POS_SALE',
          quantityChange: -item.quantity,
          previousStock: prevStock,
          newStock: p.stock,
          unitCost: p.purchaseCost,
          referenceId: newInvoice.id,
          reason: `POS Sale ${newInvoice.invoiceNumber}`,
          createdBy: 'Cashier',
        });
      }
    }

    // 3. If customer selected and credit sale or balance due, update Customer & Ledger
    if (customerId) {
      const cust = d.customers.find((c) => c.id === customerId);
      if (cust) {
        const prevBal = cust.currentBalance;

        if (isCredit || balanceDue > 0) {
          // Debit entry on ledger (increases debt)
          const newBal = prevBal + balanceDue;
          cust.totalCredit += balanceDue;
          cust.currentBalance = newBal;
          cust.updatedAt = now;

          d.customerLedger.unshift({
            id: 'cld_' + Date.now(),
            customerId: cust.id,
            date: now,
            type: 'CREDIT_SALE',
            description: `Credit Sale ${newInvoice.invoiceNumber} (${items.length} items)`,
            debit: balanceDue,
            credit: 0,
            previousBalance: prevBal,
            newBalance: newBal,
            referenceId: newInvoice.id,
            paymentMethod: 'Credit Account',
            createdBy: 'Cashier',
          });
        }

        // If partial deposit was made during credit checkout
        if (amountPaid > 0 && isCredit) {
          cust.totalPayments += amountPaid;
          d.customerPayments.unshift({
            id: 'pay_' + Date.now(),
            paymentNumber: 'PAY-2026-' + String(d.customerPayments.length + 1).padStart(4, '0'),
            customerId: cust.id,
            customerName: cust.name,
            amount: amountPaid,
            date: now,
            paymentMethod: paymentMethod || 'Cash Deposit',
            reference: 'POS Checkout Deposit',
            invoiceAllocations: [{ invoiceId: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber, amountAllocated: amountPaid }],
            previousBalance: cust.currentBalance + amountPaid,
            newBalance: cust.currentBalance,
            createdBy: 'Cashier',
            createdAt: now,
          });
        }
      }
    }

    // 4. Record audit log
    d.auditLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: now,
      action: 'POS_CHECKOUT',
      entity: 'Invoice',
      entityId: newInvoice.id,
      userId: 'usr_cashier',
      userName: 'Fatima Abdi',
      details: `Completed sale ${newInvoice.invoiceNumber} totaling $${grandTotal.toFixed(2)} (${newInvoice.paymentMethod})`,
    });
  });

  return res.json({
    success: true,
    message: `Sale ${invoiceNumber} completed successfully!`,
    invoice: newInvoice,
  });
});

// Invoices List & Details
router.get('/invoices', (req, res) => {
  const db = dbStore.get();
  const search = ((req.query.search as string) || '').toLowerCase();
  const status = (req.query.status as string) || '';
  const customerId = (req.query.customerId as string) || '';

  let list = [...db.invoices];

  if (search) {
    list = list.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(search) ||
        inv.customerName.toLowerCase().includes(search) ||
        (inv.customerPhone && inv.customerPhone.includes(search))
    );
  }

  if (status && status !== 'ALL') {
    list = list.filter((inv) => inv.paymentStatus === status);
  }

  if (customerId) {
    list = list.filter((inv) => inv.customerId === customerId);
  }

  return res.json({ success: true, invoices: list });
});

router.get('/invoices/:id', (req, res) => {
  const db = dbStore.get();
  const invoice = db.invoices.find((i) => i.id === req.params.id || i.invoiceNumber === req.params.id);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }
  return res.json({ success: true, invoice });
});

// Process Refund on Invoice
router.post('/invoices/:id/refund', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  let refunded = false;
  const now = new Date().toISOString();

  dbStore.update((d) => {
    const inv = d.invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (inv && !inv.isRefunded) {
      inv.isRefunded = true;
      inv.refundReason = reason || 'Customer returned items';
      refunded = true;

      // Restock items back to inventory
      for (const item of inv.items) {
        const prod = d.products.find((p) => p.id === item.productId);
        if (prod) {
          const prev = prod.stock;
          prod.stock += item.quantity;
          d.stockMovements.unshift({
            id: 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            date: now,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'CUSTOMER_RETURN',
            quantityChange: item.quantity,
            previousStock: prev,
            newStock: prod.stock,
            unitCost: prod.purchaseCost,
            referenceId: inv.id,
            reason: `Return/Refund on ${inv.invoiceNumber}: ${reason || 'Approved refund'}`,
            createdBy: 'Manager',
          });
        }
      }

      // If customer had an outstanding balance or credit entry, reverse it
      if (inv.customerId) {
        const cust = d.customers.find((c) => c.id === inv.customerId);
        if (cust) {
          const prevBal = cust.currentBalance;
          const newBal = Math.max(0, prevBal - inv.balanceDue);
          cust.currentBalance = newBal;
          d.customerLedger.unshift({
            id: 'cld_' + Date.now(),
            customerId: cust.id,
            date: now,
            type: 'REFUND',
            description: `Refund reversal for Invoice ${inv.invoiceNumber}`,
            debit: 0,
            credit: inv.balanceDue,
            previousBalance: prevBal,
            newBalance: newBal,
            referenceId: inv.id,
            createdBy: 'Manager',
          });
        }
      }
    }
  });

  if (refunded) {
    return res.json({ success: true, message: 'Invoice refund processed and stock restocked.' });
  }
  return res.status(400).json({ success: false, message: 'Invoice already refunded or not found.' });
});

// ----------------------------------------------------
// 7. PURCHASES & INVENTORY STOCK RECEIVING
// ----------------------------------------------------
router.get('/purchases', (req, res) => {
  const db = dbStore.get();
  return res.json({ success: true, purchases: db.purchases });
});

router.post('/purchases', (req, res) => {
  const { supplierId, items, amountPaid, notes, receiveStockNow } = req.body;
  if (!supplierId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Supplier and purchase items are required.' });
  }

  const db = dbStore.get();
  const supplier = db.suppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }

  let totalCost = 0;
  const verifiedItems = items.map((it: any) => {
    const cost = parseFloat(it.unitCost) || 0;
    const qty = parseInt(it.quantity) || 1;
    totalCost += cost * qty;
    return {
      productId: it.productId,
      name: it.name,
      sku: it.sku || '',
      unitCost: cost,
      quantity: qty,
      total: cost * qty,
    };
  });

  const paid = parseFloat(amountPaid) || 0;
  const balanceDue = Math.max(0, totalCost - paid);
  const now = new Date().toISOString();
  const poNumber = 'PO-2026-' + String(db.purchases.length + 1).padStart(4, '0');
  const poId = 'po_' + Date.now();
  const isReceived = receiveStockNow !== false;

  const newPurchase: any = {
    id: poId,
    purchaseNumber: poNumber,
    supplierId: supplier.id,
    supplierName: supplier.name,
    items: verifiedItems,
    totalCost,
    amountPaid: paid,
    balanceDue,
    paymentStatus: balanceDue <= 0.01 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
    status: isReceived ? 'RECEIVED' : 'PENDING',
    date: now,
    receivedDate: isReceived ? now : undefined,
    notes: notes || '',
    createdBy: 'Ahmed Shire',
    createdAt: now,
  };

  dbStore.update((d) => {
    d.purchases.unshift(newPurchase);

    // Update supplier balance and ledger
    const supp = d.suppliers.find((s) => s.id === supplierId);
    if (supp) {
      const prevBal = supp.currentBalance;
      const newBal = prevBal + balanceDue;
      supp.totalPurchases += totalCost;
      supp.currentBalance = newBal;
      supp.updatedAt = now;

      d.supplierLedger.unshift({
        id: 'sld_' + Date.now(),
        supplierId: supp.id,
        date: now,
        type: 'PURCHASE',
        description: `Purchase Invoice ${poNumber} (${verifiedItems.length} lines)`,
        debit: 0,
        credit: balanceDue,
        previousBalance: prevBal,
        newBalance: newBal,
        referenceId: poId,
        createdBy: 'Manager',
      });

      if (paid > 0) {
        supp.totalPayments += paid;
        d.supplierPayments.unshift({
          id: 'spay_' + Date.now(),
          paymentNumber: 'SPAY-2026-' + String(d.supplierPayments.length + 1).padStart(4, '0'),
          supplierId: supp.id,
          supplierName: supp.name,
          amount: paid,
          date: now,
          paymentMethod: 'Bank Transfer',
          reference: `Down-payment for ${poNumber}`,
          purchaseAllocations: [{ purchaseId: poId, purchaseNumber: poNumber, amountAllocated: paid }],
          previousBalance: newBal + paid,
          newBalance: newBal,
          createdBy: 'Manager',
          createdAt: now,
        });
      }
    }

    // Stock increase if received
    if (isReceived) {
      for (const item of verifiedItems) {
        const prod = d.products.find((p) => p.id === item.productId);
        if (prod) {
          const prev = prod.stock;
          prod.stock += item.quantity;
          // Update weighted average cost: ((prevStock * prevCost) + (qty * newCost)) / (prevStock + qty)
          if (prod.stock > 0) {
            prod.purchaseCost = parseFloat(
              (((prev * prod.purchaseCost) + (item.quantity * item.unitCost)) / (prev + item.quantity)).toFixed(2)
            );
          }
          prod.updatedAt = now;

          d.stockMovements.unshift({
            id: 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            date: now,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'PURCHASE_RECEIVE',
            quantityChange: item.quantity,
            previousStock: prev,
            newStock: prod.stock,
            unitCost: item.unitCost,
            referenceId: poId,
            reason: `Goods receipt from ${poNumber}`,
            createdBy: 'Manager',
          });
        }
      }
    }
  });

  return res.json({
    success: true,
    message: `Purchase order ${poNumber} created with total $${totalCost.toFixed(2)}.`,
    purchase: newPurchase,
  });
});

// Receive Pending Purchase Stock
router.post('/purchases/:id/receive', (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();
  let received = false;

  dbStore.update((d) => {
    const po = d.purchases.find((p) => p.id === id || p.purchaseNumber === id);
    if (po && po.status !== 'RECEIVED') {
      po.status = 'RECEIVED';
      po.receivedDate = now;
      received = true;

      for (const item of po.items) {
        const prod = d.products.find((p) => p.id === item.productId);
        if (prod) {
          const prev = prod.stock;
          prod.stock += item.quantity;
          prod.updatedAt = now;

          d.stockMovements.unshift({
            id: 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            date: now,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'PURCHASE_RECEIVE',
            quantityChange: item.quantity,
            previousStock: prev,
            newStock: prod.stock,
            unitCost: item.unitCost,
            referenceId: po.id,
            reason: `Goods receipt for ${po.purchaseNumber}`,
            createdBy: 'Manager',
          });
        }
      }
    }
  });

  if (received) {
    return res.json({ success: true, message: 'Stock received into inventory successfully.' });
  }
  return res.status(400).json({ success: false, message: 'Purchase already received or not found.' });
});

// ----------------------------------------------------
// 8. INVENTORY & STOCK MOVEMENTS & ADJUSTMENTS
// ----------------------------------------------------
router.get('/inventory/movements', (req, res) => {
  const db = dbStore.get();
  return res.json({ success: true, movements: db.stockMovements });
});

router.post('/inventory/adjust', (req, res) => {
  const { productId, type, quantityChange, reason } = req.body;
  const qty = parseInt(quantityChange);
  if (!productId || isNaN(qty) || qty === 0) {
    return res.status(400).json({ success: false, message: 'Valid product and non-zero quantity change are required.' });
  }

  const db = dbStore.get();
  const prod = db.products.find((p) => p.id === productId);
  if (!prod) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const now = new Date().toISOString();
  let newStock = prod.stock + qty;
  if (newStock < 0) {
    return res.status(400).json({ success: false, message: `Stock cannot drop below 0. Current stock is ${prod.stock}.` });
  }

  dbStore.update((d) => {
    const p = d.products.find((item) => item.id === productId)!;
    const prev = p.stock;
    p.stock = newStock;
    p.updatedAt = now;

    d.stockMovements.unshift({
      id: 'sm_' + Date.now(),
      date: now,
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      type: (type as any) || 'ADJUSTMENT',
      quantityChange: qty,
      previousStock: prev,
      newStock,
      unitCost: p.purchaseCost,
      reason: reason || 'Inventory adjustment',
      createdBy: 'Manager',
    });
  });

  return res.json({ success: true, message: `Inventory adjusted. New stock: ${newStock}`, newStock });
});

// ----------------------------------------------------
// 9. REPORTS CENTER (REAL CALCULATIONS & EXPORTS)
// ----------------------------------------------------
// Sales Report
router.get('/reports/sales', (req, res) => {
  const { startDate, endDate, customerId, cashierId } = req.query;
  const db = dbStore.get();

  let invoices = [...db.invoices];
  if (startDate) {
    invoices = invoices.filter((i) => i.date >= (startDate as string));
  }
  if (endDate) {
    invoices = invoices.filter((i) => i.date <= (endDate as string) + 'T23:59:59.999Z');
  }
  if (customerId) {
    invoices = invoices.filter((i) => i.customerId === customerId);
  }
  if (cashierId) {
    invoices = invoices.filter((i) => i.cashierId === cashierId);
  }

  const activeInvoices = invoices.filter((invoice) => !invoice.isRefunded);
  const totalSales = activeInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalDiscounts = activeInvoices.reduce((s, i) => s + (i.discountTotal || 0), 0);
  const totalReceived = activeInvoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalBalanceDue = activeInvoices.reduce((s, i) => s + i.balanceDue, 0);
  const totalTax = activeInvoices.reduce((s, i) => s + (i.taxTotal || 0), 0);
  const totalInsurance = activeInvoices.reduce((s, i) => s + (i.insuranceTotal || 0), 0);
  const refundedCount = invoices.filter((i) => i.isRefunded).length;

  return res.json({
    success: true,
    data: invoices,
    summary: {
      count: activeInvoices.length,
      totalSales: Number(totalSales.toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      totalReceived: Number(totalReceived.toFixed(2)),
      totalBalanceDue: Number(totalBalanceDue.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalInsurance: Number(totalInsurance.toFixed(2)),
      refundedCount,
    },
  });
});

// Purchase Report
router.get('/reports/purchases', (req, res) => {
  const { startDate, endDate, supplierId } = req.query;
  const db = dbStore.get();

  let purchases = [...db.purchases];
  if (startDate) {
    purchases = purchases.filter((p) => p.date >= (startDate as string));
  }
  if (endDate) {
    purchases = purchases.filter((p) => p.date <= (endDate as string) + 'T23:59:59.999Z');
  }
  if (supplierId) {
    purchases = purchases.filter((p) => p.supplierId === supplierId);
  }

  const totalCost = purchases.reduce((s, p) => s + p.totalCost, 0);
  const totalPaid = purchases.reduce((s, p) => s + p.amountPaid, 0);
  const totalBalanceDue = purchases.reduce((s, p) => s + p.balanceDue, 0);

  return res.json({
    success: true,
    data: purchases,
    summary: {
      count: purchases.length,
      totalCost: Number(totalCost.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalBalanceDue: Number(totalBalanceDue.toFixed(2)),
    },
  });
});

// Inventory Report
router.get('/reports/inventory', (req, res) => {
  const db = dbStore.get();
  const category = req.query.category as string;
  let products = db.products.filter((p) => !p.isArchived);

  if (category && category !== 'All') {
    products = products.filter((p) => p.category === category);
  }

  const totalItems = products.reduce((s, p) => s + p.stock, 0);
  const totalValuationCost = products.reduce((s, p) => s + (p.stock * p.purchaseCost), 0);
  const totalValuationRetail = products.reduce((s, p) => s + (p.stock * p.sellingPrice), 0);
  const potentialProfit = totalValuationRetail - totalValuationCost;
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return res.json({
    success: true,
    data: products,
    summary: {
      totalSKUs: products.length,
      totalItems,
      totalValuationCost: Number(totalValuationCost.toFixed(2)),
      totalValuationRetail: Number(totalValuationRetail.toFixed(2)),
      potentialProfit: Number(potentialProfit.toFixed(2)),
      lowStockCount,
      outOfStockCount,
    },
  });
});

// Cost of Goods Sold (COGS) Report (Perpetual Inventory / Weighted Average Cost)
router.get('/reports/cogs', (req, res) => {
  const { startDate, endDate } = req.query;
  const db = dbStore.get();

  let invoices = db.invoices.filter((i) => !i.isRefunded);
  if (startDate) {
    invoices = invoices.filter((i) => i.date >= (startDate as string));
  }
  if (endDate) {
    invoices = invoices.filter((i) => i.date <= (endDate as string) + 'T23:59:59.999Z');
  }

  // Aggregate by product sold
  const cogsMap: {
    [productId: string]: {
      productId: string;
      name: string;
      sku: string;
      quantitySold: number;
      costPerUnit: number;
      totalCOGS: number;
      revenue: number;
      grossProfit: number;
      grossMargin: number;
    };
  } = {};

  let totalCOGS = 0;
  let totalRevenue = 0;

  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const netRevenue = invoiceItemRevenueAfterInvoiceDiscount(inv, item);
      if (!cogsMap[item.productId]) {
        cogsMap[item.productId] = {
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          quantitySold: 0,
          costPerUnit: item.unitCost,
          totalCOGS: 0,
          revenue: 0,
          grossProfit: 0,
          grossMargin: 0,
        };
      }

      const itemCost = item.unitCost * item.quantity;
      cogsMap[item.productId].quantitySold += item.quantity;
      cogsMap[item.productId].totalCOGS += itemCost;
      cogsMap[item.productId].revenue += netRevenue;
      cogsMap[item.productId].grossProfit = cogsMap[item.productId].revenue - cogsMap[item.productId].totalCOGS;
      cogsMap[item.productId].grossMargin = cogsMap[item.productId].revenue > 0
        ? (cogsMap[item.productId].grossProfit / cogsMap[item.productId].revenue) * 100
        : 0;

      totalCOGS += itemCost;
      totalRevenue += netRevenue;
    });
  });

  const cogsList = Object.values(cogsMap);
  const totalGrossProfit = totalRevenue - totalCOGS;
  const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  return res.json({
    success: true,
    data: cogsList,
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCOGS: Number(totalCOGS.toFixed(2)),
      totalGrossProfit: Number(totalGrossProfit.toFixed(2)),
      overallMargin: Number(overallMargin.toFixed(1)),
      valuationMethod: 'Weighted Average Cost (Perpetual System)',
    },
  });
});

// Customer Balance Report
router.get('/reports/customer-balances', (req, res) => {
  const db = dbStore.get();
  const customers = db.customers.filter((c) => !c.isArchived);

  const reportData = customers.map((c) => {
    const custLedger = db.customerLedger.filter((l) => l.customerId === c.id);
    const lastPayment = db.customerPayments
      .filter((p) => p.customerId === c.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      id: c.id,
      customerId: c.customerId,
      name: c.name,
      phone: c.phone,
      openingBalance: c.openingBalance,
      totalCredit: c.totalCredit,
      totalPayments: c.totalPayments,
      currentBalance: c.currentBalance,
      status: c.currentBalance > 0 ? 'OWES_SHOP' : c.currentBalance < 0 ? 'CREDIT_BALANCE' : 'SETTLED',
      lastPaymentDate: lastPayment ? lastPayment.date : null,
      lastPaymentAmount: lastPayment ? lastPayment.amount : null,
    };
  });

  const totalReceivables = reportData.reduce((sum, r) => sum + (r.currentBalance > 0 ? r.currentBalance : 0), 0);
  const totalPaymentsReceived = reportData.reduce((sum, r) => sum + r.totalPayments, 0);

  return res.json({
    success: true,
    data: reportData,
    summary: {
      customerCount: reportData.length,
      totalReceivables: Number(totalReceivables.toFixed(2)),
      totalPaymentsReceived: Number(totalPaymentsReceived.toFixed(2)),
    },
  });
});

// Supplier Balance Report
router.get('/reports/supplier-balances', (req, res) => {
  const db = dbStore.get();
  const suppliers = db.suppliers.filter((s) => !s.isArchived);

  const reportData = suppliers.map((s) => {
    const lastPayment = db.supplierPayments
      .filter((p) => p.supplierId === s.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      id: s.id,
      supplierId: s.supplierId,
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      openingBalance: s.openingBalance,
      totalPurchases: s.totalPurchases,
      totalPayments: s.totalPayments,
      currentBalance: s.currentBalance,
      status: s.currentBalance > 0 ? 'SHOP_OWES_SUPPLIER' : 'SETTLED',
      lastPaymentDate: lastPayment ? lastPayment.date : null,
      lastPaymentAmount: lastPayment ? lastPayment.amount : null,
    };
  });

  const totalPayables = reportData.reduce((sum, r) => sum + (r.currentBalance > 0 ? r.currentBalance : 0), 0);
  const totalPaidToSuppliers = reportData.reduce((sum, r) => sum + r.totalPayments, 0);

  return res.json({
    success: true,
    data: reportData,
    summary: {
      supplierCount: reportData.length,
      totalPayables: Number(totalPayables.toFixed(2)),
      totalPaidToSuppliers: Number(totalPaidToSuppliers.toFixed(2)),
    },
  });
});

// ----------------------------------------------------
// 10. SETTINGS & BUSINESS & SUBSCRIPTION PLANS
// ----------------------------------------------------
router.get('/settings/business', (req, res) => {
  return res.json({ success: true, business: dbStore.get().business });
});

router.put('/settings/business', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const updates = req.body;
  let updatedBiz: any = null;

  dbStore.update((d) => {
    d.business = {
      ...d.business,
      ...updates,
      taxRate: updates.taxRate !== undefined ? parseFloat(updates.taxRate) : d.business.taxRate,
      insuranceRate: updates.insuranceRate !== undefined ? parseFloat(updates.insuranceRate) : d.business.insuranceRate,
    };
    updatedBiz = d.business;
  });

  return res.json({ success: true, message: 'Business settings saved successfully', business: updatedBiz });
});

// Currency Switcher
router.put('/settings/currency', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { currency, symbol } = req.body;
  const symbols: { [c: string]: string } = {
    USD: '$',
    SOS: 'S.Sh',
    KES: 'KSh',
    SLSH: 'Sl.Sh',
    ETB: 'Br',
    DJF: 'Fdj',
  };

  dbStore.update((d) => {
    d.business.currency = currency;
    d.business.currencySymbol = symbol || symbols[currency] || currency;
  });

  return res.json({
    success: true,
    message: `Currency changed to ${currency} (${symbols[currency] || '$'}). Historical invoices maintain their recorded figures.`,
    currency,
    symbol: symbols[currency] || '$',
  });
});

// Plans
router.get('/subscriptions/plans', (req, res) => {
  const db = dbStore.get();
  const expiryMs = new Date(db.business.subscriptionExpiry).getTime();
  const diffMs = Math.max(0, expiryMs - Date.now());
  const remainingHours = Math.ceil(diffMs / (1000 * 60 * 60));

  return res.json({
    success: true,
    plans: db.subscriptionPlans,
    currentPlan: db.business.subscriptionPlan,
    status: db.business.subscriptionStatus,
    expiryDate: db.business.subscriptionExpiry,
    trialStartedAt: db.business.trialStartedAt,
    remainingHours,
    ussdCode: db.business.dialCodeUSSD,
  });
});

router.post('/subscriptions/upgrade', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { planId, transactionRef } = req.body;
  const db = dbStore.get();
  const plan = db.subscriptionPlans.find((p) => p.id === planId);

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
  }

  if (plan.price === 0 || plan.id === 'plan_trial') {
    return res.status(400).json({
      success: false,
      message: 'The 7-Day (168h) Free Trial is strictly enforced by server initialization timestamp and cannot be manually reset. Please activate the $30 Monthly or $360 Yearly Plan.',
    });
  }

  const durationHours = plan.durationHours || (plan.id === 'plan_monthly' ? 720 : 8760);
  const newExpiryIso = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
  const newStatus = 'active';

  // Update plan in business configuration
  dbStore.update((d) => {
    d.business.subscriptionPlan = plan.name;
    d.business.subscriptionStatus = newStatus;
    d.business.subscriptionExpiry = newExpiryIso;
    d.business.dialCodeUSSD = plan.ussdCommand;

    d.auditLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'PLAN_UPGRADE',
      entity: 'Business',
      entityId: d.business.id,
      userId: 'usr_admin',
      userName: 'Maqsuud Director',
      details: `Plan activated: ${plan.name} ($${plan.price} / ${plan.period}). Valid for ${durationHours}h. Ref: ${transactionRef || 'USSD Direct: ' + plan.ussdCommand}`,
    });
  });

  return res.json({
    success: true,
    message: `${plan.name} activated! Valid for ${durationHours} hours (${Math.round(durationHours / 24)} days).`,
    planName: plan.name,
    status: newStatus,
    expiryDate: newExpiryIso,
  });
});

// Users & Roles Management
router.get('/users', (req, res) => {
  const db = dbStore.get();
  const list = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    isActive: u.isActive,
    createdAt: u.createdAt,
    biometricEnabled: u.biometricEnabled,
  }));
  return res.json({ success: true, users: list, roles: db.roles });
});

router.post('/users', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  const db = dbStore.get();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
  }

  const newUser: any = {
    id: 'usr_' + Date.now(),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: role || 'cashier',
    phone: phone || '',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  dbStore.update((d) => {
    d.users.push(newUser);
  });

  return res.json({ success: true, message: 'User added successfully', user: newUser });
});

router.put('/users/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  const { name, email, role, phone, password, isActive } = req.body;

  const db = dbStore.get();
  if (email && db.users.some((u) => u.id !== id && u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Another operator already uses this email address.' });
  }

  let updatedUser: any = null;
  dbStore.update((d) => {
    const u = d.users.find((user) => user.id === id);
    if (u) {
      if (name) u.name = name.trim();
      if (email) u.email = email.trim();
      if (role) u.role = role;
      if (phone !== undefined) u.phone = phone;
      if (isActive !== undefined) u.isActive = Boolean(isActive);
      if (password && String(password).trim().length > 0) {
        u.passwordHash = bcrypt.hashSync(String(password).trim(), 10);
      }
      updatedUser = {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
      };
      d.auditLogs.unshift({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: u.id,
        userId: (req as any).user?.id || 'usr_admin',
        userName: (req as any).user?.name || 'Admin',
        details: `Updated operator account ${u.name} (${u.email}, role: ${u.role})`,
      });
    }
  });

  if (updatedUser) {
    return res.json({ success: true, message: 'Operator updated successfully', user: updatedUser });
  }
  return res.status(404).json({ success: false, message: 'User not found' });
});

router.put('/users/:id/status', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  const { isActive } = req.body;

  dbStore.update((d) => {
    const u = d.users.find((user) => user.id === id);
    if (u) {
      u.isActive = !!isActive;
    }
  });

  return res.json({ success: true, message: 'User status updated' });
});

router.delete('/users/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;

  if (id === (req as any).user?.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own active administrator account.',
    });
  }

  let deleted = false;
  dbStore.update((d) => {
    const idx = d.users.findIndex((user) => user.id === id);
    if (idx !== -1) {
      const removed = d.users[idx];
      d.users.splice(idx, 1);
      deleted = true;
      d.auditLogs.unshift({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'USER_DELETED',
        entity: 'User',
        entityId: id,
        userId: (req as any).user?.id || 'usr_admin',
        userName: (req as any).user?.name || 'Admin',
        details: `Deleted operator account ${removed.name} (${removed.email})`,
      });
    }
  });

  if (deleted) {
    return res.json({ success: true, message: 'Operator deleted permanently' });
  }
  return res.status(404).json({ success: false, message: 'User not found' });
});

router.delete('/invoices/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  let deleted = false;
  dbStore.update((d) => {
    const idx = d.invoices.findIndex((i) => i.id === id || i.invoiceNumber === id);
    if (idx !== -1) {
      d.invoices.splice(idx, 1);
      deleted = true;
    }
  });
  if (deleted) {
    return res.json({ success: true, message: 'Invoice deleted successfully' });
  }
  return res.status(404).json({ success: false, message: 'Invoice not found' });
});

router.get('/roles', (req, res) => {
  return res.json({ success: true, roles: dbStore.get().roles });
});

export default router;
