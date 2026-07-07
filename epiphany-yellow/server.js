'use strict';
require('dotenv').config();

const express    = require('express');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');
const sanitize   = require('sanitize-html');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'enquiries.json');

/* ── JSON database helpers ─────────────────────────── */
function readDB() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return []; }
}
function writeDB(rows) {
  fs.writeFileSync(DB, JSON.stringify(rows, null, 2));
}
function insertEnquiry(data) {
  const rows = readDB();
  const record = {
    id:         rows.length ? rows[rows.length - 1].id + 1 : 1,
    ...data,
    status:     'new',
    created_at: new Date().toISOString()
  };
  rows.push(record);
  writeDB(rows);
  return record;
}

/* ── Mailer ────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT   === '465',
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

function adminEmailHtml(d) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>body{margin:0;padding:0;background:#f4f7f9;font-family:Inter,sans-serif}
  .wrap{max-width:600px;margin:2rem auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.08)}
  .hdr{background:#16324F;padding:2rem;text-align:center}.hdr h1{color:#fff;font-size:1.3rem;margin:0;font-weight:700}
  .hdr p{color:rgba(255,255,255,.5);margin:.3rem 0 0;font-size:.85rem}.body{padding:2rem}
  .row{display:flex;gap:1rem;margin-bottom:1rem}.cell{flex:1;background:#f8fafc;border-radius:10px;padding:1rem}
  .cell label{font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:.25rem}
  .cell p{margin:0;font-size:.9rem;color:#16324F;font-weight:600}
  .msg{background:#f0faf8;border-left:3px solid #2A9D8F;border-radius:0 10px 10px 0;padding:1rem 1.25rem;margin-top:1.25rem}
  .msg label{font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#2A9D8F;display:block;margin-bottom:.4rem}
  .msg p{margin:0;font-size:.88rem;color:#374151;line-height:1.6}
  .tag{display:inline-block;padding:.25rem .75rem;border-radius:99px;background:rgba(42,157,143,.1);color:#2A9D8F;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:1.25rem}
  .cta{display:block;text-align:center;background:#16324F;color:#fff;text-decoration:none;padding:.9rem 1.5rem;border-radius:10px;font-weight:700;font-size:.88rem;margin-top:1.5rem}
  .foot{text-align:center;padding:1.25rem;color:#9ca3af;font-size:.72rem;border-top:1px solid #f1f5f9}</style>
  </head><body><div class="wrap">
  <div class="hdr"><h1>New Fostering Enquiry</h1><p>${new Date().toLocaleString('en-GB',{timeZone:'Europe/London'})}</p></div>
  <div class="body">
    <span class="tag">${d.interest==='become'?'Become a Carer':d.interest==='transfer'?'Transfer Agency':'Learn More'}</span>
    <div class="row"><div class="cell"><label>Name</label><p>${d.first_name} ${d.last_name}</p></div><div class="cell"><label>Phone</label><p>${d.phone}</p></div></div>
    <div class="cell"><label>Email</label><p>${d.email}</p></div>
    ${d.message?`<div class="msg"><label>Message</label><p>${d.message}</p></div>`:''}
    <a href="${process.env.SITE_URL || 'http://localhost:' + PORT}/admin" class="cta">View in Dashboard →</a>
  </div>
  <div class="foot">Epiphany Foster Care &bull; Ofsted Registered &bull; Confidential</div>
  </div></body></html>`;
}

function confirmEmailHtml(d) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>body{margin:0;padding:0;background:#f4f7f9;font-family:Inter,sans-serif}
  .wrap{max-width:600px;margin:2rem auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.08)}
  .hdr{background:linear-gradient(135deg,#16324F 0%,#1c3f5c 100%);padding:2.5rem;text-align:center}
  .mark{width:64px;height:64px;border-radius:16px;background:#2A9D8F;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem}
  .hdr h1{color:#fff;font-size:1.4rem;margin:0;font-weight:700}.hdr p{color:rgba(255,255,255,.55);margin:.4rem 0 0;font-size:.88rem}
  .body{padding:2.5rem}h2{font-size:1.15rem;color:#16324F;margin:0 0 .6rem}
  p{color:#6b7280;line-height:1.7;font-size:.9rem;margin:0 0 1rem}
  .steps{margin:1.5rem 0;display:flex;flex-direction:column;gap:.6rem}
  .step{display:flex;align-items:flex-start;gap:.85rem;padding:.85rem 1rem;background:#f8fafc;border-radius:10px}
  .sn{width:28px;height:28px;border-radius:50%;background:#16324F;color:#fff;font-size:.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.05rem}
  .st p{margin:0;font-size:.83rem;color:#374151;font-weight:600}.st span{font-size:.75rem;color:#9ca3af}
  .cta{display:block;text-align:center;background:#2A9D8F;color:#fff;text-decoration:none;padding:1rem 1.5rem;border-radius:10px;font-weight:700;font-size:.9rem;margin:1.5rem 0 1rem}
  .tel{text-align:center;font-size:.82rem;color:#6b7280}.tel a{color:#16324F;font-weight:700;text-decoration:none}
  .foot{text-align:center;padding:1.25rem;color:#9ca3af;font-size:.72rem;border-top:1px solid #f1f5f9}</style>
  </head><body><div class="wrap">
  <div class="hdr">
    <div class="mark"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
    <h1>We've received your enquiry</h1><p>And we'll be in touch within 2 hours</p>
  </div>
  <div class="body">
    <h2>Hi ${d.first_name}, thank you for reaching out 👋</h2>
    <p>Your enquiry has been received and a dedicated fostering advisor will call you on <strong>${d.phone}</strong> within 2 hours (Mon–Fri, 8am–8pm).</p>
    <div class="steps">
      <div class="step"><div class="sn">1</div><div class="st"><p>Advisor call</p><span>Within 2 hours on ${d.phone}</span></div></div>
      <div class="step"><div class="sn">2</div><div class="st"><p>Home visit arranged</p><span>A warm, relaxed conversation at your home</span></div></div>
      <div class="step"><div class="sn">3</div><div class="st"><p>Free training begins</p><span>Skills to Foster — paid, local, transformative</span></div></div>
    </div>
    <a href="https://www.epiphanyfostercare.org.uk/#testimonials" class="cta">Read stories from our carers →</a>
    <p class="tel">Questions? Call us free on <a href="tel:08001234567">0800 123 4567</a></p>
  </div>
  <div class="foot">Epiphany Foster Care Ltd &bull; Registered in England &amp; Wales &bull; Ofsted Registered</div>
  </div></body></html>`;
}

/* ── Middleware ────────────────────────────────────── */
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));

// Block access to server-side and sensitive files
app.use((req, res, next) => {
  const blocked = /^\/(server\.js|package(-lock)?\.json|\.env|enquiries\.json|node_modules)(\/|$)/i;
  if (blocked.test(req.path)) return res.status(403).end();
  next();
});

app.use(express.static(path.join(__dirname)));

const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many enquiries from this IP. Please try again later or call 0800 123 4567.' }
});

function requireAdmin(req, res, next) {
  const auth     = req.headers.authorization || '';
  const expected = 'Basic ' + Buffer.from(`admin:${process.env.ADMIN_PASS || 'changeme123'}`).toString('base64');
  if (auth !== expected) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Epiphany Admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/* ── POST /api/enquiry ─────────────────────────────── */
app.post('/api/enquiry', enquiryLimiter, async (req, res) => {
  const { first, last, email, phone, interest, message } = req.body;

  if (!first || !last || !email || !phone)
    return res.status(400).json({ error: 'Missing required fields.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address.' });
  if (String(phone).replace(/\D/g, '').length < 10)
    return res.status(400).json({ error: 'Invalid phone number.' });

  const record = insertEnquiry({
    first_name: sanitize(String(first).trim(), { allowedTags: [] }).slice(0, 100),
    last_name:  sanitize(String(last).trim(),  { allowedTags: [] }).slice(0, 100),
    email:      sanitize(String(email).trim(), { allowedTags: [] }).slice(0, 200),
    phone:      sanitize(String(phone).trim(), { allowedTags: [] }).slice(0, 30),
    interest:   sanitize(String(interest || 'become').trim(), { allowedTags: [] }).slice(0, 20),
    message:    sanitize(String(message || '').trim(), { allowedTags: [] }).slice(0, 2000),
    ip:         req.ip
  });

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    (async () => {
      try {
        await transporter.sendMail({
          from:    `"Epiphany Foster Care" <${process.env.SMTP_USER}>`,
          to:      process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: `New Enquiry — ${record.first_name} ${record.last_name} (${record.interest})`,
          html:    adminEmailHtml(record)
        });
        await transporter.sendMail({
          from:    `"Epiphany Foster Care" <${process.env.SMTP_USER}>`,
          to:      record.email,
          subject: `We've received your enquiry, ${record.first_name} 🌟`,
          html:    confirmEmailHtml(record)
        });
      } catch (err) { console.error('[mail]', err.message); }
    })();
  }

  res.json({ ok: true, id: record.id });
});

/* ── PATCH /api/admin/enquiries/:id/status ─────────── */
app.patch('/api/admin/enquiries/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['new','contacted','approved','declined'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  const rows = readDB();
  const row  = rows.find(r => r.id === parseInt(req.params.id));
  if (!row) return res.status(404).json({ error: 'Not found' });
  row.status = status;
  writeDB(rows);
  res.json({ ok: true });
});

/* ── GET /api/admin/enquiries ──────────────────────── */
app.get('/api/admin/enquiries', requireAdmin, (req, res) => {
  res.json(readDB().reverse());
});

/* ── GET /api/admin/stats ──────────────────────────── */
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const rows  = readDB();
  const today = new Date().toISOString().slice(0, 10);
  const week  = new Date(Date.now() - 7*24*60*60*1000).toISOString();

  const byInterest = Object.entries(
    rows.reduce((a, r) => { a[r.interest] = (a[r.interest]||0)+1; return a; }, {})
  ).map(([interest, n]) => ({ interest, n }));

  const byStatus = Object.entries(
    rows.reduce((a, r) => { a[r.status] = (a[r.status]||0)+1; return a; }, {})
  ).map(([status, n]) => ({ status, n }));

  res.json({
    total:      rows.length,
    today:      rows.filter(r => r.created_at.startsWith(today)).length,
    week:       rows.filter(r => r.created_at >= week).length,
    byInterest, byStatus
  });
});

/* ── GET /admin ────────────────────────────────────── */
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));
app.get('/robots.txt',  (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));

/* ── Start ─────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n  ✦ Epiphany Foster Care server running at http://localhost:${PORT}`);
  console.log(`  ✦ Admin dashboard:           http://localhost:${PORT}/admin`);
  if (!process.env.ADMIN_PASS) console.warn('  ⚠  ADMIN_PASS not set — using insecure default. Set it in .env before deploying.\n');
});
