import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Export raw records to Excel (.xlsx or .csv)
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportToCSV(data: any[], fileName: string) {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate PDF for Customer Profile Statement (Section 6 Requirement)
export function exportCustomerProfilePDF(customer: any, business: any, ledgerEntries: any[] = []) {
  const doc = new jsPDF();
  const currencySymbol = business?.currencySymbol || '$';

  // Header Banner — Deep Emerald [5, 150, 105] with Crimson Accent Bar [225, 29, 72]
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(225, 29, 72);
  doc.rect(0, 30, 210, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text((business?.name || 'MAQSUUD ICT POS').toUpperCase(), 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(236, 253, 245);
  doc.text(
    `Tel: ${business?.phone || '0611688269'} | Somtel: 0621688269 | Salaam Bank AccN: 38524624`,
    14,
    21
  );
  doc.text(`Address: ${business?.address || 'Mogadishu, Somalia'} | Next-Gen ICT & Retail Intelligence`, 14, 26);

  // Document Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL CUSTOMER STATEMENT & PROFILE', 14, 44);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`, 14, 50);

  // Customer Info Box
  doc.setFillColor(248, 250, 249);
  doc.setDrawColor(209, 250, 229);
  doc.roundedRect(14, 54, 182, 42, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Customer ID: ${customer.customerId}`, 20, 62);
  doc.text(`Customer Name: ${customer.name}`, 20, 70);
  doc.text(`Phone: ${customer.phone}`, 20, 78);
  doc.text(`Address: ${customer.address || 'N/A'}`, 20, 86);

  doc.text(`Opening Balance: ${currencySymbol}${(customer.openingBalance || 0).toFixed(2)}`, 110, 62);
  doc.text(`Total Credit Sales: ${currencySymbol}${(customer.totalCredit || 0).toFixed(2)}`, 110, 70);
  doc.text(`Total Payments Made: ${currencySymbol}${(customer.totalPayments || 0).toFixed(2)}`, 110, 78);

  const isOwing = customer.currentBalance > 0;
  doc.setTextColor(isOwing ? 225 : 5, isOwing ? 29 : 150, isOwing ? 72 : 105);
  doc.setFontSize(11);
  doc.text(
    `Current Balance: ${currencySymbol}${Math.abs(customer.currentBalance || 0).toFixed(2)} ${isOwing ? '(Owed to Shop)' : '(Credit Balance)'}`,
    110,
    88
  );

  // Ledger Table
  if (ledgerEntries.length > 0) {
    const tableBody = ledgerEntries.map((l) => [
      new Date(l.date).toLocaleDateString(),
      l.type,
      l.description,
      l.debit > 0 ? `${currencySymbol}${l.debit.toFixed(2)}` : '-',
      l.credit > 0 ? `${currencySymbol}${l.credit.toFixed(2)}` : '-',
      `${currencySymbol}${l.newBalance.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 104,
      head: [['Date', 'Type', 'Description', 'Debit (+)', 'Credit (-)', 'Balance']],
      body: tableBody,
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 249] },
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Maqsuud ICT POS • EVC/Waafi: 0611688269 | Somtel/Waafi: 0621688269 | Salaam Bank AccN: 38524624`,
    14,
    pageHeight - 10
  );

  doc.save(`Customer_Profile_${customer.customerId}_${customer.name.replace(/\s+/g, '_')}.pdf`);
}

// Generate PDF for Invoice Receipt
export function exportInvoicePDF(invoice: any, business: any) {
  if (!invoice || !Array.isArray(invoice.items) || invoice.items.length === 0) {
    throw new Error('Invoice has no item details to print.');
  }
  const doc = new jsPDF();
  const currencySymbol = business?.currencySymbol || '$';
  const money = (value: unknown) => `${currencySymbol}${(Number(value) || 0).toFixed(2)}`;

  // Header Banner — Deep Obsidian & Emerald with Crimson Strip
  doc.setFillColor(7, 11, 9);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 31.5, 145, 2.5, 'F');
  doc.setFillColor(225, 29, 72);
  doc.rect(145, 31.5, 65, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(String(business?.name || 'MAQSUUD ICT POS').toUpperCase().slice(0, 38), 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(167, 243, 208);
  doc.text(`EVC/WaafiPay: 0611688269 | Somtel/WaafiPay: 0621688269 | Salaam Bank AccN: 38524624`, 14, 21);
  doc.text(`Address: ${String(business?.address || 'Mogadishu, Somalia').slice(0, 50)}`, 14, 27);

  // Right invoice badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text('INVOICE', 160, 15);
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`# ${invoice.invoiceNumber || '—'}`, 160, 22);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 160, 28);

  // Customer & Cashier Info
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${invoice.customerName || 'Walk-in Retail'}`, 14, 50);
  if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 14, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Sale Details:', 120, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cashier: ${invoice.cashierName || 'Cashier Desk'}`, 120, 50);
  doc.text(`Payment: ${invoice.paymentMethod} (${invoice.saleType})`, 120, 55);
  doc.text(`Status: ${invoice.paymentStatus}`, 120, 60);

  // Items Table
  const tableData = invoice.items.map((it: any) => [
    String(it.name || 'Product'),
    it.sku || '-',
    money(it.unitPrice),
    Number(it.quantity) || 0,
    Number(it.discount) > 0 ? money(it.discount) : '-',
    money(it.total ?? (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)),
  ]);

  autoTable(doc, {
    startY: 66,
    head: [['Product Description', 'SKU', 'Unit Price', 'Qty', 'Disc.', 'Total']],
    body: tableData,
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { bottom: 28 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 8;
  const totalsHeight = 38;
  if (finalY + totalsHeight > doc.internal.pageSize.height - 25) {
    doc.addPage();
    finalY = 20;
  }

  // Totals Box
  const startX = 130;
  doc.setFontSize(9);
  doc.text(`Subtotal:`, startX, finalY);
  doc.text(money(invoice.subtotal), 190, finalY, { align: 'right' });

  if (invoice.discountTotal > 0) {
    doc.text(`Discount:`, startX, finalY + 6);
    doc.text(`-${money(invoice.discountTotal)}`, 190, finalY + 6, { align: 'right' });
  }

  if (invoice.taxTotal > 0) {
    doc.text(`Tax:`, startX, finalY + 12);
    doc.text(money(invoice.taxTotal), 190, finalY + 12, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Grand Total:`, startX, finalY + 19);
  doc.text(money(invoice.grandTotal), 190, finalY + 19, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Amount Paid:`, startX, finalY + 25);
  doc.text(money(invoice.amountPaid), 190, finalY + 25, { align: 'right' });

  if (invoice.balanceDue > 0) {
    doc.setTextColor(225, 29, 72);
    doc.setFont('helvetica', 'bold');
    doc.text(`Balance Due:`, startX, finalY + 31);
    doc.text(money(invoice.balanceDue), 190, finalY + 31, { align: 'right' });
  }

  // Footer Note
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const footer = String(business?.receiptFooter || 'Mahadsanid! Waad ku mahadsantahay ganacsigaaga. Thank you!').slice(0, 90);
    doc.text(footer, 14, pageHeight - 16, { maxWidth: pageWidth - 28 });
    doc.text(`Maqsuud ICT POS • Page ${page} of ${doc.getNumberOfPages()}`, 14, pageHeight - 10);
  }

  doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
}

// Generate PDF for Generic Table Reports (Sales, Purchases, Inventory, COGS)
export function exportReportPDF(title: string, columns: string[], rows: any[][], summaryText: string = '') {
  const doc = new jsPDF();
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFillColor(225, 29, 72);
  doc.rect(0, 22, 210, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`MAQSUUD ICT POS — ${title.toUpperCase()}`, 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Exported: ${new Date().toLocaleString()} | Maqsuud ICT Valuation System Verified`, 14, 32);

  if (summaryText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(summaryText, 14, 38);
  }

  autoTable(doc, {
    startY: summaryText ? 44 : 36,
    head: [columns],
    body: rows,
    headStyles: { fillColor: [7, 11, 9], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 249] },
  });

  doc.save(`Maqsuud_ICT_${title.replace(/\s+/g, '_')}_Report.pdf`);
}
