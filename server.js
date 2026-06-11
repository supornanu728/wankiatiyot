const express = require('express');
const { Database } = require('node-sqlite3-wasm');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database('wankiatiyot.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    position TEXT DEFAULT '',
    tickets INTEGER DEFAULT 1,
    travel INTEGER DEFAULT 0,
    ticket_price INTEGER DEFAULT 1000,
    travel_price INTEGER DEFAULT 0,
    paid_ticket INTEGER DEFAULT 0,
    paid_travel INTEGER DEFAULT 0,
    note TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const defaults = [
  ['ticket_price','1000'],['travel_price','200'],
  ['event_name','วันแห่งเกียรติยศ'],['event_date','18 กรกฎาคม 2569 | 18:00 – 22:00 น.'],
  ['event_venue','อิมแพ็ค ชาเลนเจอร์ ฮอลล์ 1'],['promptpay_id','0000000000'],
  ['account_name',''],['bank_name',''],['account_no',''],['max_tickets','10'],['qr_image',''],
];
const ins = db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)');
for (const [k,v] of defaults) ins.run([k,v]);

function getSetting(key){ const r=db.prepare('SELECT value FROM settings WHERE key=?').get([key]); return r?r.value:null; }

function adminGuard(req,res,next){
  if(req.headers['x-admin-password']!==ADMIN_PASSWORD) return res.status(401).json({error:'Unauthorized'});
  next();
}

// public settings
app.get('/api/settings',(req,res)=>{
  const rows=db.prepare('SELECT key,value FROM settings').all();
  const s=Object.fromEntries(rows.map(r=>[r.key,r.value]));
  res.json({ticket_price:+s.ticket_price,travel_price:+s.travel_price,event_name:s.event_name,event_date:s.event_date,event_venue:s.event_venue,promptpay_id:s.promptpay_id,account_name:s.account_name,bank_name:s.bank_name,account_no:s.account_no,max_tickets:+s.max_tickets,qr_image:s.qr_image||''});
});

// public bookings
app.get('/api/bookings',(req,res)=>{
  res.json(db.prepare('SELECT id,name,tickets,COALESCE(travel,0) travel,COALESCE(ticket_price,0) ticket_price,COALESCE(travel_price,0) travel_price,COALESCE(paid_ticket,0) paid_ticket,COALESCE(paid_travel,0) paid_travel,created_at FROM bookings ORDER BY created_at DESC').all());
});

// admin login
app.post('/api/admin/login',(req,res)=>{
  req.body.password===ADMIN_PASSWORD?res.json({ok:true}):res.status(401).json({error:'รหัสผ่านไม่ถูกต้อง'});
});

// admin get all
app.get('/api/admin/bookings',adminGuard,(req,res)=>{
  res.json(db.prepare('SELECT id,name,phone,position,tickets,COALESCE(travel,0) travel,COALESCE(ticket_price,0) ticket_price,COALESCE(travel_price,0) travel_price,COALESCE(paid_ticket,0) paid_ticket,COALESCE(paid_travel,0) paid_travel,note,created_at FROM bookings ORDER BY created_at DESC').all());
});

// admin add
app.post('/api/admin/bookings',adminGuard,(req,res)=>{
  const {name,phone,position,tickets,travel}=req.body;
  if(!name) return res.status(400).json({error:'ต้องมีชื่อ'});
  const tp=+getSetting('ticket_price');
  const trp=+getSetting('travel_price');
  const qty=Math.max(1,+tickets||1);
  const hasTrv=travel?1:0;
  const r=db.prepare('INSERT INTO bookings (name,phone,position,tickets,travel,ticket_price,travel_price) VALUES (?,?,?,?,?,?,?)').run([name,phone||'',position||'',qty,hasTrv,tp*qty,0]);
  res.json({id:r.lastInsertRowid});
});

// admin patch paid status
app.patch('/api/admin/bookings/:id',adminGuard,(req,res)=>{
  const {paid_ticket,paid_travel,note,name,position,tickets,travel}=req.body;
  const fields=[]; const vals=[];
  if(paid_ticket!==undefined){fields.push('paid_ticket=?');vals.push(paid_ticket?1:0);}
  if(paid_travel!==undefined){fields.push('paid_travel=?');vals.push(paid_travel?1:0);}
  if(note!==undefined){fields.push('note=?');vals.push(note);}
  if(name!==undefined){fields.push('name=?');vals.push(name);}
  if(position!==undefined){fields.push('position=?');vals.push(position);}
  if(tickets!==undefined){
    const qty=Math.max(1,+tickets||1);
    const tp=+getSetting('ticket_price');
    fields.push('tickets=?','ticket_price=?');
    vals.push(qty,tp*qty);
  }
  if(travel!==undefined){
    const hasTrv=travel?1:0;
    const trp=hasTrv?+getSetting('travel_price'):0;
    fields.push('travel=?','travel_price=?');
    vals.push(hasTrv,trp);
  }
  if(fields.length) db.prepare(`UPDATE bookings SET ${fields.join(',')} WHERE id=?`).run([...vals,req.params.id]);
  res.json({ok:true});
});

// admin delete
app.delete('/api/admin/bookings/:id',adminGuard,(req,res)=>{
  db.prepare('DELETE FROM bookings WHERE id=?').run([req.params.id]);
  res.json({ok:true});
});

// apply travel price to all bookings with travel=1
app.post('/api/admin/apply-travel-price',adminGuard,(req,res)=>{
  const trp=+getSetting('travel_price');
  db.prepare('UPDATE bookings SET travel_price=? WHERE travel=1').run([trp]);
  res.json({ok:true,price:trp});
});

// admin settings
app.put('/api/admin/settings',adminGuard,(req,res)=>{
  const allowed=['ticket_price','travel_price','event_name','event_date','event_venue','promptpay_id','max_tickets','account_name','bank_name','account_no','qr_image'];
  const u=db.prepare('UPDATE settings SET value=? WHERE key=?');
  for(const k of allowed) if(req.body[k]!==undefined) u.run([String(req.body[k]),k]);
  res.json({ok:true});
});

// stats
app.get('/api/admin/stats',adminGuard,(req,res)=>{
  const total=db.prepare('SELECT COUNT(*) c FROM bookings').get().c;
  const paid_ticket=db.prepare('SELECT COUNT(*) c FROM bookings WHERE paid_ticket=1').get().c;
  const paid_travel=db.prepare('SELECT COUNT(*) c FROM bookings WHERE travel=1 AND paid_travel=1').get().c;
  const unpaid_ticket=db.prepare('SELECT COUNT(*) c FROM bookings WHERE paid_ticket=0').get().c;
  const revenue_ticket=db.prepare('SELECT COALESCE(SUM(ticket_price),0) s FROM bookings WHERE paid_ticket=1').get().s;
  const revenue_travel=db.prepare('SELECT COALESCE(SUM(travel_price),0) s FROM bookings WHERE travel=1 AND paid_travel=1').get().s;
  const tickets=db.prepare('SELECT COALESCE(SUM(tickets),0) s FROM bookings').get().s;
  res.json({total,paid_ticket,paid_travel,unpaid_ticket,revenue_ticket,revenue_travel,tickets});
});

app.listen(PORT,()=>console.log(`✅  http://localhost:${PORT}`));
