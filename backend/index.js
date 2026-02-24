const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
// allow the public dev URL and localhost (vite) during development
const allowedOrigins = [
  'https://expert-space-waddle-r4pvxj7x76w5fpqv7-3000.app.github.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (e.g. curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'));
  }
}));

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

async function loadMedicines() {
  try {
    const csvPath = path.join(__dirname, '..', 'data', 'medicines.csv');
    const raw = await fs.readFile(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1);
    const items = rows.map(line => {
      const cols = line.split(',').map(c => c.trim());
      const obj = {};
      headers.forEach((h, i) => {
        let val = cols[i] ?? '';
        // coerce common types
        if (/^\d+$/.test(val)) val = parseInt(val, 10);
        if (/^\d+\.\d+$/.test(val)) val = parseFloat(val);
        if (/^(True|False|true|false)$/.test(val)) val = /^T/i.test(val);
        obj[h] = val;
      });
      return obj;
    });
    return items;
  } catch (err) {
    console.error('Failed to load medicines.csv', err);
    throw err;
  }
}

app.get('/inventory', async (req, res) => {
  try {
    const meds = await loadMedicines();
    res.json(meds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load inventory' });
  }
});

// agent endpoints
const agent = require('./agent');

app.post('/agent/validate', async (req, res) => {
  try {
    const { text, customerId } = req.body || {};
    const result = await agent.validateOrder({ text, customerId });
    res.json(result);
  } catch (err) {
    console.error('validate error', err);
    res.status(500).json({ error: 'Validation failed' });
  }
});

app.get('/alerts', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const alerts = await agent.getRefillAlerts(days);
    res.json(alerts);
  } catch (err) {
    console.error('alerts error', err);
    res.status(500).json({ error: 'Failed to compute alerts' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
