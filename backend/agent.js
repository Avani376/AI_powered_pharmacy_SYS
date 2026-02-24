const fs = require('fs').promises;
const path = require('path');

async function parseCSV(csvPath) {
  const raw = await fs.readFile(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1);
  return rows.map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => {
      let val = cols[i] ?? '';
      if (/^\d+$/.test(val)) val = parseInt(val, 10);
      if (/^\d+\.\d+$/.test(val)) val = parseFloat(val);
      if (/^(True|False|true|false)$/.test(val)) val = /^T/i.test(val);
      obj[h] = val;
    });
    return obj;
  });
}

async function loadMedicines() {
  const csvPath = path.join(__dirname, '..', 'data', 'medicines.csv');
  return parseCSV(csvPath);
}

async function loadOrders() {
  const csvPath = path.join(__dirname, '..', 'data', 'orders.csv');
  const rows = await parseCSV(csvPath);
  // coerce Date and numeric fields
  return rows.map(r => ({
    ...r,
    Date: r.Date ? new Date(r.Date) : null,
    Quantity: typeof r.Quantity === 'string' ? parseFloat(r.Quantity) : r.Quantity,
    UnitPrice: typeof r.UnitPrice === 'string' ? parseFloat(r.UnitPrice) : r.UnitPrice,
    Total: typeof r.Total === 'string' ? parseFloat(r.Total) : r.Total,
  }));
}

function findMedicineByText(medicines, text) {
  if (!text) return null;
  const t = text.toLowerCase();
  // try exact name match first
  for (const m of medicines) {
    if (m.Name && m.Name.toLowerCase() === t) return m;
  }
  // else substring match
  for (const m of medicines) {
    if (m.Name && t.includes(m.Name.toLowerCase())) return m;
  }
  // try token matching
  const tokens = t.split(/\s+/).filter(Boolean);
  for (const m of medicines) {
    const nameTokens = m.Name.toLowerCase().split(/\s+/);
    if (tokens.some(tok => nameTokens.includes(tok))) return m;
  }
  return null;
}

async function validateOrder({ text = '', customerId = null } = {}) {
  const medicines = await loadMedicines();
  const orders = await loadOrders();
  // extract customer if in text (e.g., C001)
  let cust = customerId;
  const custMatch = text.match(/\bC\d+\b/i);
  if (!cust && custMatch) cust = custMatch[0].toUpperCase();

  // extract quantity
  const qtyMatch = text.match(/\b(\d+)\b/);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

  const medicine = findMedicineByText(medicines, text);
  if (!medicine) {
    return {
      ok: false,
      reason: 'Medicine not found',
      medicine: null,
      quantity,
      prescriptionRequired: false,
      lowStock: false,
      customerId: cust,
    };
  }

  const stock = typeof medicine.Stock === 'number' ? medicine.Stock : parseInt(medicine.Stock || '0', 10);
  const prescriptionRequired = medicine['Prescription Required'] === true || medicine.PrescriptionRequired === true || /^T/i.test(String(medicine['Prescription Required'] || medicine.PrescriptionRequired || 'false'));
  const lowStock = stock <= 10 || quantity > stock;

  const messageParts = [];
  messageParts.push(`Medicine: ${medicine.Name}`);
  messageParts.push(`Requested: ${quantity} ${medicine.Unit || ''}`);
  messageParts.push(`In stock: ${stock}`);
  if (prescriptionRequired) messageParts.push('Requires prescription');
  if (lowStock) messageParts.push('Low stock — flag');

  return {
    ok: true,
    reason: lowStock ? 'low_stock' : 'ok',
    medicine: medicine.Name,
    quantity,
    prescriptionRequired,
    lowStock,
    stock,
    unit: medicine.Unit,
    message: messageParts.join(' | '),
    customerId: cust,
  };
}

async function getRefillAlerts(days = 30) {
  const orders = await loadOrders();
  const byCustomer = {};
  for (const o of orders) {
    if (!o.CustomerID) continue;
    const cid = o.CustomerID;
    const date = o.Date instanceof Date ? o.Date : new Date(o.Date);
    if (!byCustomer[cid] || byCustomer[cid].last < date) {
      byCustomer[cid] = { last: date, lastOrder: o };
    }
  }
  const now = new Date();
  const alerts = [];
  for (const [cid, info] of Object.entries(byCustomer)) {
    const diffMs = now - info.last;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= days) {
      alerts.push({
        customerId: cid,
        daysSinceLastOrder: diffDays,
        lastOrderDate: info.last.toISOString().split('T')[0],
        lastMedicine: info.lastOrder ? info.lastOrder.Medicine : null,
      });
    }
  }
  return alerts.sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder);
}

module.exports = { loadMedicines, loadOrders, validateOrder, getRefillAlerts };
