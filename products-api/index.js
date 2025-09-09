import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';
import axios from 'axios';
import path from 'path';

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 8081;
const DATA_DIR = '/data';
const AUDIT_CSV = path.join(DATA_DIR, 'audit.csv');
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://webhook:8082/alert';

// Asegura carpeta y encabezado del CSV
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(AUDIT_CSV)) {
  fs.writeFileSync(
    AUDIT_CSV,
    'request_id,actor,role,resource,action,decision,source_ip,ts,t0_ms\n'
  );
}

app.post('/products/:id/sensitive-op', (req, res) => {
  // Camino feliz (autorizado): respuesta mock
  return res.json({ ok: true, product: req.params.id, op: 'sensitive-op' });
});

app.post('/audit/denied', async (req, res) => {
  const e = req.body || {};
  const line = [
    e.requestId, e.actor, e.role, e.resource, e.action,
    e.decision, e.sourceIp, e.ts, e.t0
  ].map(v => (v === undefined ? '' : String(v).replaceAll(',', ' '))).join(',') + '\n';

  try { fs.appendFileSync(AUDIT_CSV, line); } catch (err) { console.error('CSV write error:', err.message); }

  // Dispara alerta para medir latencia
  try { await axios.post(WEBHOOK_URL, { requestId: e.requestId, t0: e.t0 }, { timeout: 1500 }); }
  catch (err) { console.error('Webhook send failed:', err.message); }

  return res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Products-API listening on ${PORT}`));
