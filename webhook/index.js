import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 8082;
const LOG = process.env.LOG_FILE || '/data/alerts.csv';
if (!fs.existsSync('/data')) fs.mkdirSync('/data', { recursive: true });
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, 'requestId,t0_ms,t3_ms,latency_ms\n');

app.post('/alert', (req,res)=>{
  const {requestId,t0}=req.body||{};
  const t3=Date.now();
  const latency=t3-(t0||t3);
  fs.appendFileSync(LOG,`${requestId},${t0||''},${t3},${latency}\n`);
  res.json({ok:true,t3,latency});
});

app.get('/metrics',(req,res)=>{
  try{
    const data=fs.readFileSync(LOG,'utf-8').trim().split('\n').slice(1).map(l=>parseInt(l.split(',')[3],10));
    data.sort((a,b)=>a-b);
    const p=(q)=> data.length?data[Math.floor(q*(data.length-1))]:null;
    res.json({count:data.length,p50:p(0.5),p95:p(0.95),p99:p(0.99)});
  }catch(e){res.json({error:e.message});}
});

app.listen(PORT,()=>console.log(`Webhook on ${PORT}`));
