# 👑 วันเกียรติยศ 2569 — ระบบจองบัตร

## 📁 โครงสร้างไฟล์

```
wan-kiatiyot/
├── server.js          ← Backend (Node.js + Express)
├── package.json       ← Dependencies
├── wankiatiyot.db     ← SQLite database (สร้างอัตโนมัติ)
└── public/
    └── index.html     ← Frontend ทั้งหมด
```

---

## 🚀 วิธีติดตั้งและรัน (Local)

### ขั้นที่ 1: ติดตั้ง Node.js
ดาวน์โหลดจาก https://nodejs.org (แนะนำ v18+)

### ขั้นที่ 2: ติดตั้ง dependencies
```bash
cd wan-kiatiyot
npm install
```

### ขั้นที่ 3: รัน server
```bash
npm start
```

### ขั้นที่ 4: เปิดเว็บ
```
http://localhost:3000
```

---

## ⚙️ ตั้งค่า

### เปลี่ยนรหัสผ่านแอดมิน
รัน server พร้อม environment variable:
```bash
ADMIN_PASSWORD=รหัสของคุณ node server.js
```

### เปลี่ยน Port
```bash
PORT=8080 node server.js
```

---

## ☁️ Deploy ขึ้น Cloud (ฟรี)

### วิธีที่ 1: Railway.app (แนะนำ ง่ายสุด)
1. สมัคร https://railway.app
2. กด "New Project" → "Deploy from GitHub"
3. อัปโหลดโค้ดขึ้น GitHub ก่อน หรือใช้ Railway CLI
4. เพิ่ม Environment Variable: `ADMIN_PASSWORD=รหัสของคุณ`
5. Railway จะให้ URL สาธารณะให้อัตโนมัติ

### วิธีที่ 2: Render.com
1. สมัคร https://render.com
2. New → Web Service → Connect GitHub repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. เพิ่ม Environment Variable: `ADMIN_PASSWORD=รหัสของคุณ`

### วิธีที่ 3: VPS (DigitalOcean, Vultr)
```bash
# ติดตั้ง PM2 สำหรับรันตลอดเวลา
npm install -g pm2
pm2 start server.js --name "wankiatiyot"
pm2 save
pm2 startup
```

---

## 🔑 Default Settings

| ค่า | Default |
|-----|---------|
| Admin Password | `admin1234` |
| ราคาบัตร | 1,000 บาท |
| ค่ารถ | 200 บาท |
| PromptPay | ต้องตั้งค่าในหน้าแอดมิน |

---

## 📱 ฟีเจอร์ทั้งหมด

### หน้าจองบัตร (สาธารณะ)
- กรอกชื่อ + เบอร์โทร
- เลือกจำนวนบัตร
- เลือกร่วมเดินทาง
- คำนวณราคาอัตโนมัติ
- แสดง QR PromptPay หลังจอง

### หน้ารายชื่อ (สาธารณะ)
- ดูรายชื่อทั้งหมด
- คลิกชื่อเพื่อแสดง QR + ยอดชำระ
- แสดงสถานะการอนุมัติ

### หน้าแอดมิน (ล็อคด้วย password)
- Dashboard ยอดรวม / จำนวนบัตร
- ตั้งค่าราคาบัตร + ค่ารถ
- ตั้งค่า PromptPay ID
- เพิ่มรายชื่อโดยแอดมิน
- อนุมัติ / ยกเลิก / ลบรายการ
- กรอง pending / approved / cancelled

---

## 🛠 API Endpoints

| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/settings` | ดึง settings สาธารณะ |
| GET | `/api/bookings` | รายชื่อทั้งหมด |
| POST | `/api/bookings` | จองบัตร |
| POST | `/api/admin/login` | Login แอดมิน |
| GET | `/api/admin/bookings` | รายชื่อ (admin) |
| PATCH | `/api/admin/bookings/:id` | อัปเดตสถานะ |
| DELETE | `/api/admin/bookings/:id` | ลบรายการ |
| PUT | `/api/admin/settings` | บันทึก settings |
| GET | `/api/admin/stats` | สถิติ |
| POST | `/api/admin/bookings` | เพิ่มโดยแอดมิน |
