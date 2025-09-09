import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import morgan from 'morgan';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const PRODUCTS_API = process.env.PRODUCTS_API || 'http://products-api:8081';
const AUDIT_ENDPOINT = `${PRODUCTS_API}/audit/denied`;

function checkRBAC(role, resource, action) {
  if (resource === 'product' && action === 'sensitive-op') {
    return role === 'security_admin';
  }
  return true;
}

app.post('/products/:id/sensitive-op', async (req, res) => {
  const t0 = Date.now();
  const reqId = uuidv4();
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const role = decoded.role || 'unknown';
    const allowed = checkRBAC(role, 'product', 'sensitive-op');
    if (!allowed) {
      try {
        await axios.post(AUDIT_ENDPOINT, {
          requestId: reqId, t0,
          actor: decoded.user || decoded.sub || 'unknown',
          role, resource: 'product', action: 'sensitive-op',
          decision: 'deny', sourceIp: req.ip,
          ts: new Date().toISOString()
        }, { timeout: 1500 });
      } catch (e) {}
      return res.status(403).json({ error: 'Forbidden', requestId: reqId });
    }
    const resp = await axios.post(`${PRODUCTS_API}/products/${req.params.id}/sensitive-op`,
      req.body || {}, { timeout: 2000, headers: { 'x-request-id': reqId }});
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    return res.status(500).json({ error: 'Gateway error' });
  }
});

app.listen(PORT, () => console.log(`Gateway on ${PORT}`));
