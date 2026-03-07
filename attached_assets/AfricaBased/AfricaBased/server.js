import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createRequire } from 'module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const _require = createRequire(import.meta.url);
const IntaSend = _require('intasend-node');
const cookieParser = _require('cookie-parser');
const nodemailer = _require('nodemailer');

const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || 'ab-secure';
const ADMIN_PAGE_SECRET = process.env.ADMIN_PAGE_SECRET || 'abp_s9k2m4f';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'africabased-secret-key-change-in-prod';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Email (Nodemailer) ───────────────────────────────────────────────────────
const GMAIL_USER = 'africabasedtechnologies@gmail.com';
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
});

async function sendMail({ to, subject, html }) {
  try {
    await emailTransporter.sendMail({ from: `"AfricaBased" <${GMAIL_USER}>`, to, subject, html });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

function welcomeEmailHtml(username) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1b2a;color:#e0e0e0;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0a9e8c,#0d7a6e);padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">Welcome to AfricaBased!</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px">Hello <strong>${username}</strong>,</p>
      <p>Your account has been created successfully. You can now log in and start investing.</p>
      <div style="text-align:center;margin:30px 0">
        <a href="https://africabased.replit.app/login" style="background:#0a9e8c;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold">Login to Your Account</a>
      </div>
      <p style="font-size:13px;color:#aaa">If you didn't create this account, please ignore this email.</p>
    </div>
    <div style="background:#071624;padding:16px;text-align:center;font-size:12px;color:#666">
      &copy; ${new Date().getFullYear()} AfricaBased Technologies. All rights reserved.
    </div>
  </div>`;
}

function resetEmailHtml(username, resetLink) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1b2a;color:#e0e0e0;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0a9e8c,#0d7a6e);padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:26px">Password Reset Request</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px">Hello <strong>${username}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>5 minutes</strong>.</p>
      <div style="text-align:center;margin:30px 0">
        <a href="${resetLink}" style="background:#0a9e8c;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold">Reset My Password</a>
      </div>
      <p style="font-size:13px;color:#aaa">If you didn't request a password reset, you can safely ignore this email.</p>
      <p style="font-size:12px;word-break:break-all;color:#888">Or copy this link: ${resetLink}</p>
    </div>
    <div style="background:#071624;padding:16px;text-align:center;font-size:12px;color:#666">
      &copy; ${new Date().getFullYear()} AfricaBased Technologies. All rights reserved.
    </div>
  </div>`;
}

// ─── Email helpers: deposit / withdrawal notifications ────────────────────────
function depositReceivedEmailHtml(username, amount) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1b2a;color:#e0e0e0;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0a9e8c,#0d7a6e);padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">&#128179; Deposit Received</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px">Hello <strong>${username}</strong>,</p>
      <p>We have received your deposit request of <strong style="color:#0a9e8c">KES ${Number(amount).toLocaleString()}</strong> and it is currently <strong>under review</strong>.</p>
      <p>Your balance will be credited once our team confirms the payment. This usually takes a few minutes to a few hours.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="https://africabased.replit.app/home" style="background:#0a9e8c;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold">View Dashboard</a>
      </div>
    </div>
    <div style="background:#071624;padding:16px;text-align:center;font-size:12px;color:#666">&copy; ${new Date().getFullYear()} AfricaBased Technologies</div>
  </div>`;
}

function depositConfirmedEmailHtml(username, amount) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1b2a;color:#e0e0e0;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0a9e8c,#0d7a6e);padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">&#10004; Deposit Confirmed!</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px">Hello <strong>${username}</strong>,</p>
      <p>Great news! Your deposit of <strong style="color:#0a9e8c">KES ${Number(amount).toLocaleString()}</strong> has been <strong>confirmed and credited</strong> to your wallet balance.</p>
      <p>You can now invest this amount in any available investment plan.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="https://africabased.replit.app/home" style="background:#0a9e8c;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold">Start Investing</a>
      </div>
    </div>
    <div style="background:#071624;padding:16px;text-align:center;font-size:12px;color:#666">&copy; ${new Date().getFullYear()} AfricaBased Technologies</div>
  </div>`;
}

function depositRejectedEmailHtml(username, amount, reason) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1b2a;color:#e0e0e0;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#c0392b,#962d22);padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">&#10008; Deposit Not Approved</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px">Hello <strong>${username}</strong>,</p>
      <p>Unfortunately, your deposit of <strong>KES ${Number(amount).toLocaleString()}</strong> could not be verified${reason ? ': <em>' + reason + '</em>' : '.'}.</p>
      <p>If you believe this is a mistake or need help, please contact our support team.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="https://africabased.replit.app/manual-deposit" style="background:#0a9e8c;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold">Try Again</a>
      </div>
    </div>
    <div style="background:#071624;padding:16px;text-align:center;font-size:12px;color:#666">&copy; ${new Date().getFullYear()} AfricaBased Technologies</div>
  </div>`;
}

function withdrawalRequestEmailHtml(username, amount, fee, method) {
  const net = parseFloat(amount);
  const feeAmt = parseFloat(fee);
  const methodLabel = method === 'bank' ? 'Bank Transfer' : 'M-Pesa';
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1b2a;color:#e0e0e0;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#1a6eb5,#145a9c);padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">&#128184; Withdrawal Request Received</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px">Hello <strong>${username}</strong>,</p>
      <p>Your withdrawal request has been received and is being processed.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#0a1628;border-radius:8px;overflow:hidden">
        <tr><td style="padding:12px 16px;color:#8899aa;border-bottom:1px solid #1a2e45">Amount requested</td><td style="padding:12px 16px;text-align:right;font-weight:bold;border-bottom:1px solid #1a2e45">KES ${net.toLocaleString()}</td></tr>
        <tr><td style="padding:12px 16px;color:#8899aa;border-bottom:1px solid #1a2e45">Processing fee (9.5%)</td><td style="padding:12px 16px;text-align:right;border-bottom:1px solid #1a2e45">KES ${feeAmt.toLocaleString()}</td></tr>
        <tr><td style="padding:12px 16px;color:#8899aa">Method</td><td style="padding:12px 16px;text-align:right">${methodLabel}</td></tr>
      </table>
      <p style="font-size:13px;color:#8899aa">You will receive a confirmation email once the payment has been sent to your account.</p>
    </div>
    <div style="background:#071624;padding:16px;text-align:center;font-size:12px;color:#666">&copy; ${new Date().getFullYear()} AfricaBased Technologies</div>
  </div>`;
}

function withdrawalPaidEmailHtml(username, amount, method) {
  const net = parseFloat(amount);
  const methodLabel = method === 'bank' ? 'Bank Transfer' : 'M-Pesa';
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1b2a;color:#e0e0e0;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0a9e8c,#0d7a6e);padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">&#9989; Payment Sent!</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px">Hello <strong>${username}</strong>,</p>
      <p>Your withdrawal of <strong style="color:#0a9e8c">KES ${net.toLocaleString()}</strong> has been <strong>paid successfully</strong> via ${methodLabel}.</p>
      <p>The funds should reflect in your account shortly. If you do not receive the funds within 24 hours, please contact support.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="https://africabased.replit.app/home" style="background:#0a9e8c;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold">View Dashboard</a>
      </div>
    </div>
    <div style="background:#071624;padding:16px;text-align:center;font-size:12px;color:#666">&copy; ${new Date().getFullYear()} AfricaBased Technologies</div>
  </div>`;
}

function withdrawalRejectedEmailHtml(username, amount, reason) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1b2a;color:#e0e0e0;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#c0392b,#962d22);padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">&#10008; Withdrawal Rejected</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px">Hello <strong>${username}</strong>,</p>
      <p>Your withdrawal of <strong>KES ${Number(amount).toLocaleString()}</strong> was not processed${reason ? ': <em>' + reason + '</em>' : '.'}.</p>
      <p>Your balance has been restored. Please contact support if you need assistance.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="https://africabased.replit.app/withdraw" style="background:#0a9e8c;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold">Try Again</a>
      </div>
    </div>
    <div style="background:#071624;padding:16px;text-align:center;font-size:12px;color:#666">&copy; ${new Date().getFullYear()} AfricaBased Technologies</div>
  </div>`;
}

// ─── Registration OTP store (in-memory, keyed by email) ──────────────────────
const regOtpStore = new Map(); // email → { otp, expires, attempts }

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpEmailHtml(username, otp) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1b2a;color:#e0e0e0;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0a9e8c,#0d7a6e);padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:26px">Verify Your Email</h1>
    </div>
    <div style="padding:30px">
      <p style="font-size:16px">Hello <strong>${username}</strong>,</p>
      <p>Use the code below to complete your AfricaBased registration. It expires in <strong>5 minutes</strong>.</p>
      <div style="text-align:center;margin:30px 0">
        <div style="display:inline-block;background:#0a1628;border:2px solid #0a9e8c;border-radius:12px;padding:20px 40px">
          <span style="font-size:38px;font-weight:700;letter-spacing:12px;color:#0a9e8c;font-family:monospace">${otp}</span>
        </div>
      </div>
      <p style="font-size:13px;color:#aaa">If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div style="background:#071624;padding:16px;text-align:center;font-size:12px;color:#666">
      &copy; ${new Date().getFullYear()} AfricaBased Technologies. All rights reserved.
    </div>
  </div>`;
}

// ─── WebAuthn: in-memory challenge store (TTL 5 min) ─────────────────────────
const webauthnChallenges = new Map();
function setChallenge(key, challenge) {
  webauthnChallenges.set(key, { challenge, expires: Date.now() + 5 * 60 * 1000 });
}
function getChallenge(key) {
  const entry = webauthnChallenges.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { webauthnChallenges.delete(key); return null; }
  webauthnChallenges.delete(key);
  return entry.challenge;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of webauthnChallenges.entries()) {
    if (now > v.expires) webauthnChallenges.delete(k);
  }
}, 60 * 1000);

// ─── Security: Helmet (HTTP headers) ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cookieParser());

// ─── Admin page access control ────────────────────────────────────────────────
const PROTECTED_ADMIN_PAGES = [
  'Admin-panel','admin-settings','admin-management','admin-product',
  'admin-approve','admin-deposit','admin-exchange','admin-pending-applications',
  'admin-referrals','admin-service','admin-user','admin-withdraw',
  'admin-withdraw-new','sub-admin-panel','impersonate'
];

app.use((req, res, next) => {
  const rawPath = req.path.replace(/^\//, '').replace(/\.html$/, '');
  if (rawPath === 'admin-login' || rawPath === 'admin-login.html') {
    return res.redirect('/');
  }
  if (rawPath === ADMIN_SECRET_PATH) {
    return res.sendFile(join(__dirname, 'admin-login.html'));
  }
  if (PROTECTED_ADMIN_PAGES.includes(rawPath)) {
    const cookie = req.cookies && req.cookies._abAdmin;
    if (cookie !== ADMIN_PAGE_SECRET) {
      return res.redirect('/');
    }
  }
  next();
});

app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'publickey-credentials-create=*, publickey-credentials-get=*');
  next();
});

// ─── Security: CORS ───────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : true;
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// ─── Security: Rate Limiters ─────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  skip: (req) => req.headers['x-admin-key'] === (process.env.SUPER_ADMIN_KEY || '1540568e'),
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again in 1 hour.' },
});
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use('/api/', apiLimiter);

// ─── Security: simple input sanitizer ────────────────────────────────────────
function sanitizeString(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/[<>'"]/g, '').trim();
}

// ─── Middleware: verify auth token ───────────────────────────────────────────
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      'SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > NOW()',
      [token]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Session expired' });
    req.user = result.rows[0];
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// ─── AUTH: Send Registration OTP ─────────────────────────────────────────────
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

app.post('/api/auth/send-otp', otpLimiter, async (req, res) => {
  const username = sanitizeString(req.body.username || '');
  const email    = sanitizeString((req.body.email || '').toLowerCase());
  const password = req.body.password || '';

  if (!username || username.length < 3 || username.length > 40) {
    return res.status(400).json({ error: 'Username must be 3–40 characters' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'This username is already taken' });
    }

    const otp     = generateOtp();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    regOtpStore.set(email, { otp, expires, attempts: 0 });

    await sendMail({
      to: email,
      subject: 'Your AfricaBased verification code',
      html: otpEmailHtml(username, otp)
    });

    res.json({ success: true, message: 'Verification code sent to ' + email });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
});

// ─── AUTH: Register ──────────────────────────────────────────────────────────
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  const username      = sanitizeString(req.body.username || '');
  const phone         = sanitizeString(req.body.phone || '');
  const email         = sanitizeString((req.body.email || '').toLowerCase());
  const password      = req.body.password || '';
  const otp           = sanitizeString(req.body.otp || '');
  const referral_code = sanitizeString(req.body.referral_code || '');
  const fingerprint   = typeof req.body.fingerprint === 'string' ? req.body.fingerprint.slice(0, 128) : null;
  const phoneVal      = phone || null;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  if (!otp) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  // Verify OTP
  const stored = regOtpStore.get(email);
  if (!stored) {
    return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
  }
  if (Date.now() > stored.expires) {
    regOtpStore.delete(email);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
  }
  stored.attempts = (stored.attempts || 0) + 1;
  if (stored.attempts > 5) {
    regOtpStore.delete(email);
    return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new code.' });
  }
  if (stored.otp !== otp) {
    return res.status(400).json({ error: `Incorrect code. ${5 - stored.attempts} attempt${5 - stored.attempts !== 1 ? 's' : ''} remaining.` });
  }
  regOtpStore.delete(email); // OTP consumed

  try {
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    if (phoneVal) {
      const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneVal]);
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: 'An account with this phone number already exists' });
      }
    }

    const password_hash = await bcrypt.hash(password, 12);
    const referred_by   = referral_code ? referral_code.toUpperCase() : null;
    const result = await pool.query(
      'INSERT INTO users (username, phone, email, password_hash, referred_by, device_fingerprint) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, username, phone, email, created_at',
      [username, phoneVal, email, password_hash, referred_by, fingerprint]
    );
    const user = result.rows[0];

    await pool.query(
      'INSERT INTO profiles (user_id, username, phone, email) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO NOTHING',
      [user.id, username, phoneVal, email]
    );

    const token   = jwt.sign({ userId: user.id, jti: crypto.randomBytes(16).toString('hex') }, JWT_SECRET, { expiresIn: '7d' });
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [user.id, token, expires]
    );

    res.json({ user, token });

    // Send welcome email (fire-and-forget, doesn't block response)
    if (email) {
      sendMail({
        to: email,
        subject: 'Welcome to AfricaBased!',
        html: welcomeEmailHtml(username)
      });
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── AUTH: Login ─────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const identifier  = sanitizeString(req.body.identifier || '');
  const password    = req.body.password || '';
  const fingerprint = typeof req.body.fingerprint === 'string' ? req.body.fingerprint.slice(0, 128) : null;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your credentials' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 OR phone=$1 OR username=$1 LIMIT 1',
      [identifier]
    );
    if (!result.rows.length) {
      return res.status(401).json({ error: 'No account found with these credentials' });
    }
    const user = result.rows[0];

    // Account lockout check
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(429).json({ error: `Account temporarily locked. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Account not set up yet. Please re-register.' });
    }

    // Admin locked account
    if (user.locked === true) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await pool.query(
          'UPDATE users SET failed_login_attempts=$1, locked_until=$2 WHERE id=$3',
          [newAttempts, lockUntil, user.id]
        );
        return res.status(429).json({ error: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` });
      }
      await pool.query('UPDATE users SET failed_login_attempts=$1 WHERE id=$2', [newAttempts, user.id]);
      const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
      return res.status(401).json({ error: `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.` });
    }

    // Reset failed attempts on success
    await pool.query('UPDATE users SET failed_login_attempts=0, locked_until=NULL WHERE id=$1', [user.id]);

    // Optionally update fingerprint if provided and none stored
    if (fingerprint && !user.device_fingerprint) {
      await pool.query('UPDATE users SET device_fingerprint=$1 WHERE id=$2', [fingerprint, user.id]);
    }

    const token   = jwt.sign({ userId: user.id, jti: crypto.randomBytes(16).toString('hex') }, JWT_SECRET, { expiresIn: '7d' });
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1,$2,$3) ON CONFLICT (token) DO UPDATE SET expires_at=EXCLUDED.expires_at',
      [user.id, token, expires]
    );

    const { password_hash, failed_login_attempts, locked_until, device_fingerprint, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── AUTH: Forgot Password ───────────────────────────────────────────────────
const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

app.post('/api/auth/forgot-password', forgotLimiter, async (req, res) => {
  const email = sanitizeString((req.body.email || '').toLowerCase());
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  // Always respond with success to prevent email enumeration
  res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });

  try {
    const result = await pool.query('SELECT id, username FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return;
    const user = result.rows[0];

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await pool.query('UPDATE users SET reset_token=$1, reset_token_expires=$2 WHERE id=$3', [token, expires, user.id]);

    const host = req.headers.host || 'africabased.replit.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const resetLink = `${proto}://${host}/reset-password?token=${token}`;

    sendMail({
      to: email,
      subject: 'Reset Your AfricaBased Password',
      html: resetEmailHtml(user.username, resetLink)
    });
  } catch (err) {
    console.error('Forgot password error:', err);
  }
});

// ─── AUTH: Reset Password ────────────────────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ error: 'Invalid request. Password must be at least 8 characters.' });
  }
  try {
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE reset_token=$1 AND reset_token_expires > NOW()',
      [token]
    );
    if (!result.rows.length) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }
    const user = result.rows[0];
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      'UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expires=NULL WHERE id=$2',
      [hash, user.id]
    );
    // Invalidate all existing sessions for security
    await pool.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// ─── AUTH: Logout ────────────────────────────────────────────────────────────
app.post('/api/auth/logout', async (req, res) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]).catch(() => {});
  }
  res.json({ success: true });
});

// ─── BIOMETRIC (WebAuthn) ─────────────────────────────────────────────────────
function getRpInfo(req) {
  const host = req.headers.host || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const rpID = process.env.RP_ID || host.replace(/:\d+$/, '');
  const origin = process.env.ORIGIN || (isLocal ? `http://${host}` : `https://${rpID}`);
  return { rpID, rpName: 'AfricaBased', origin };
}

// Begin registration (requires login)
app.post('/api/auth/webauthn/register/begin', requireAuth, async (req, res) => {
  try {
    const { rpID, rpName } = getRpInfo(req);
    const userId = req.user.id;
    const existing = await pool.query(
      'SELECT credential_id FROM webauthn_credentials WHERE user_id=$1', [userId]
    );
    const excludeCredentials = existing.rows.map(r => ({
      id: r.credential_id,
      type: 'public-key',
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(userId),
      userName: req.user.email || req.user.username,
      userDisplayName: req.user.username,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'required',
        requireResidentKey: true,
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    setChallenge(`reg:${userId}`, options.challenge);
    res.json(options);
  } catch (e) {
    console.error('WebAuthn register begin error:', e);
    res.status(500).json({ error: 'Failed to start biometric registration' });
  }
});

// Complete registration (requires login)
app.post('/api/auth/webauthn/register/complete', requireAuth, async (req, res) => {
  try {
    const { rpID, origin } = getRpInfo(req);
    const userId = req.user.id;
    const { response, deviceName } = req.body;

    const expectedChallenge = getChallenge(`reg:${userId}`);
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge expired. Please try again.' });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Biometric verification failed.' });
    }

    const { credential } = verification.registrationInfo;
    const credId     = Buffer.from(credential.id).toString('base64url');
    const pubKey     = Buffer.from(credential.publicKey).toString('base64url');
    const counter    = credential.counter;
    const transports = JSON.stringify(response.response?.transports || []);
    const devType    = verification.registrationInfo.credentialDeviceType || 'unknown';
    const backedUp   = verification.registrationInfo.credentialBackedUp || false;
    const name       = (typeof deviceName === 'string' ? deviceName.slice(0, 80) : null) || 'Biometric Device';

    await pool.query(
      `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports, device_type, backed_up, name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (credential_id) DO UPDATE SET counter=$4, name=$8`,
      [userId, credId, pubKey, counter, transports, devType, backedUp, name]
    );

    res.json({ success: true, message: 'Biometric login enabled!' });
  } catch (e) {
    console.error('WebAuthn register complete error:', e);
    res.status(500).json({ error: 'Failed to save biometric credential' });
  }
});

// Begin authentication (public — user may provide identifier)
app.post('/api/auth/webauthn/auth/begin', async (req, res) => {
  try {
    const { rpID } = getRpInfo(req);
    const { identifier } = req.body;
    let allowCredentials = [];
    let challengeKey = 'anon:' + crypto.randomBytes(8).toString('hex');
    let userId = null;
    let identifierFound = false;

    if (identifier) {
      const userRes = await pool.query(
        'SELECT id FROM users WHERE email=$1 OR phone=$1 OR username=$1 LIMIT 1',
        [sanitizeString(identifier)]
      );
      if (userRes.rows.length) {
        userId = userRes.rows[0].id;
        identifierFound = true;
        challengeKey = `auth:${userId}`;
        const creds = await pool.query(
          'SELECT credential_id, transports FROM webauthn_credentials WHERE user_id=$1', [userId]
        );
        allowCredentials = creds.rows.map(r => ({
          id: r.credential_id,
          type: 'public-key',
          transports: (() => { try { return JSON.parse(r.transports); } catch { return []; } })(),
        }));
        // User found but no passkeys registered — tell client immediately
        if (!allowCredentials.length) {
          return res.status(200).json({
            hasCredentials: false,
            identifierFound: true,
            error: 'No biometric login set up for this account yet. You can enable it from your Profile settings.',
          });
        }
      } else {
        // Identifier provided but no matching user
        return res.status(200).json({
          hasCredentials: false,
          identifierFound: false,
          error: 'Account not found. Check your email, phone or username.',
        });
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials: allowCredentials.length ? allowCredentials : undefined,
    });

    setChallenge(challengeKey, options.challenge);
    res.json({ options, challengeKey, hasCredentials: true });
  } catch (e) {
    console.error('WebAuthn auth begin error:', e);
    res.status(500).json({ error: 'Failed to start biometric login' });
  }
});

// Complete authentication (public)
app.post('/api/auth/webauthn/auth/complete', async (req, res) => {
  try {
    const { rpID, origin } = getRpInfo(req);
    const { response, challengeKey } = req.body;
    if (!response || !challengeKey) {
      return res.status(400).json({ error: 'Missing response data' });
    }

    const expectedChallenge = getChallenge(challengeKey);
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge expired. Please try again.' });
    }

    const rawId = response.id || response.rawId;
    const credRes = await pool.query(
      `SELECT wc.*, u.id as uid FROM webauthn_credentials wc
       JOIN users u ON u.id = wc.user_id
       WHERE wc.credential_id=$1 LIMIT 1`,
      [rawId]
    );
    if (!credRes.rows.length) {
      return res.status(401).json({ error: 'Biometric credential not recognised' });
    }
    const credRow = credRes.rows[0];
    const user = (await pool.query('SELECT * FROM users WHERE id=$1', [credRow.user_id])).rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.locked) return res.status(403).json({ error: 'Account suspended. Contact support.' });
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(429).json({ error: 'Account temporarily locked.' });
    }

    const authenticator = {
      credentialID:        Buffer.from(credRow.credential_id, 'base64url'),
      credentialPublicKey: Buffer.from(credRow.public_key,   'base64url'),
      counter:             Number(credRow.counter),
      transports:          (() => { try { return JSON.parse(credRow.transports); } catch { return []; } })(),
    };

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id:        authenticator.credentialID,
        publicKey: authenticator.credentialPublicKey,
        counter:   authenticator.counter,
        transports: authenticator.transports,
      },
    });

    if (!verification.verified) {
      return res.status(401).json({ error: 'Biometric verification failed' });
    }

    await pool.query(
      'UPDATE webauthn_credentials SET counter=$1 WHERE credential_id=$2',
      [verification.authenticationInfo.newCounter, credRow.credential_id]
    );
    await pool.query('UPDATE users SET failed_login_attempts=0, locked_until=NULL WHERE id=$1', [user.id]);

    const token   = jwt.sign({ userId: user.id, jti: crypto.randomBytes(16).toString('hex') }, JWT_SECRET, { expiresIn: '7d' });
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [user.id, token, expires]
    );

    const { password_hash, failed_login_attempts, locked_until, device_fingerprint, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (e) {
    console.error('WebAuthn auth complete error:', e);
    res.status(500).json({ error: 'Biometric login failed. Try your password instead.' });
  }
});

// List user's biometric credentials (requires login)
app.get('/api/auth/webauthn/credentials', requireAuth, async (req, res) => {
  try {
    const rows = await pool.query(
      'SELECT id, name, device_type, backed_up, created_at FROM webauthn_credentials WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ credentials: rows.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

// Delete a biometric credential (requires login)
app.delete('/api/auth/webauthn/credentials/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM webauthn_credentials WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Credential not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to remove credential' });
  }
});

// ─── AUTH: Me (get current user) ─────────────────────────────────────────────
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  const profile = await pool.query('SELECT * FROM profiles WHERE user_id=$1', [req.user.id]);
  const pf = profile.rows[0] || {};
  const locked = {
    username: !!(safeUser.username),
    mpesa_phone: !!(pf.mpesa_phone),
    bank: !!(pf.bank_name || pf.bank_account_number || pf.bank_account_name)
  };
  res.json({ user: safeUser, profile: pf, locked });
});

// ─── PROFILE: Update ─────────────────────────────────────────────────────────
app.put('/api/profile', requireAuth, async (req, res) => {
  const { username, phone, avatar_url, mpesa_phone, bank_name, bank_paybill, bank_account_number, bank_account_name } = req.body;
  try {
    const cur = await pool.query('SELECT * FROM profiles WHERE user_id=$1', [req.user.id]);
    const p = cur.rows[0] || {};
    const isFirstMpesa = !p.mpesa_phone && mpesa_phone;

    await pool.query(
      `INSERT INTO profiles (user_id, username, phone, email, avatar_url, mpesa_phone, bank_name, bank_paybill, bank_account_number, bank_account_name, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET username = EXCLUDED.username,
           phone = EXCLUDED.phone,
           avatar_url = EXCLUDED.avatar_url,
           mpesa_phone = CASE WHEN profiles.mpesa_phone IS NOT NULL THEN profiles.mpesa_phone ELSE EXCLUDED.mpesa_phone END,
           bank_name = CASE WHEN profiles.bank_name IS NOT NULL THEN profiles.bank_name ELSE EXCLUDED.bank_name END,
           bank_paybill = CASE WHEN profiles.bank_paybill IS NOT NULL THEN profiles.bank_paybill ELSE EXCLUDED.bank_paybill END,
           bank_account_number = CASE WHEN profiles.bank_account_number IS NOT NULL THEN profiles.bank_account_number ELSE EXCLUDED.bank_account_number END,
           bank_account_name = CASE WHEN profiles.bank_account_name IS NOT NULL THEN profiles.bank_account_name ELSE EXCLUDED.bank_account_name END,
           updated_at = NOW()`,
      [req.user.id, username || req.user.username, phone || req.user.phone, req.user.email, avatar_url || null,
       mpesa_phone || null, bank_name || null, bank_paybill || null, bank_account_number || null, bank_account_name || null]
    );
    const usersRow = await pool.query('SELECT username, phone FROM users WHERE id=$1', [req.user.id]);
    const existingUser = usersRow.rows[0] || {};
    const updateUserParts = [];
    const updateUserVals = [];
    if (!existingUser.username && username) {
      updateUserParts.push(`username=$${updateUserParts.length + 1}`);
      updateUserVals.push(username);
    }
    if (isFirstMpesa) {
      updateUserParts.push(`phone=$${updateUserParts.length + 1}`);
      updateUserVals.push(mpesa_phone);
    }
    if (updateUserParts.length) {
      updateUserVals.push(req.user.id);
      await pool.query(`UPDATE users SET ${updateUserParts.join(',')} WHERE id=$${updateUserVals.length}`, updateUserVals);
    }
    const profile = await pool.query('SELECT * FROM profiles WHERE user_id=$1', [req.user.id]);
    const pf = profile.rows[0] || {};
    const locked = {
      username: !!(existingUser.username),
      mpesa_phone: !!(pf.mpesa_phone && !isFirstMpesa) || !!(p.mpesa_phone),
      bank: !!(p.bank_name || p.bank_account_number || p.bank_account_name)
    };
    res.json({ profile: pf, locked });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ─── BALANCE ─────────────────────────────────────────────────────────────────
app.get('/api/balance', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT account_balance, wallet_balance FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    const row = result.rows[0] || {};
    const income_balance = parseFloat(row.account_balance || 0);
    const wallet_balance = parseFloat(row.wallet_balance || 0);
    res.json({
      balance: income_balance,
      income_balance,
      wallet_balance,
      total_balance: income_balance + wallet_balance
    });
  } catch (e) {
    console.error('Balance fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// ─── WITHDRAWALS ──────────────────────────────────────────────────────────────
app.get('/api/withdrawals', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY requested_at DESC',
    [req.user.id]
  );
  res.json({ withdrawals: result.rows });
});

app.post('/api/withdrawals', requireAuth, async (req, res) => {
  const { amount, notes } = req.body;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO withdrawals (user_id, amount, notes) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, amount, notes || null]
    );
    res.json({ withdrawal: result.rows[0] });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: 'Withdrawal request failed' });
  }
});

// ─── DEPOSITS ─────────────────────────────────────────────────────────────────
app.get('/api/deposits', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM deposits WHERE user_id = $1 ORDER BY deposited_at DESC',
    [req.user.id]
  );
  res.json({ deposits: result.rows });
});

app.post('/api/deposits', requireAuth, async (req, res) => {
  const { amount, method, reference } = req.body;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO deposits (user_id, amount, method, reference) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, amount, method || 'mpesa', reference || null]
    );
    res.json({ deposit: result.rows[0] });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ error: 'Deposit request failed' });
  }
});

// ─── INVESTMENTS ──────────────────────────────────────────────────────────────
app.get('/api/investments', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT i.*, COALESCE(p.name, i.product_name) as product_name
     FROM investments i LEFT JOIN products p ON i.product_id = p.id
     WHERE i.user_id = $1 ORDER BY i.start_date DESC`,
    [req.user.id]
  );
  res.json({ investments: result.rows });
});

app.post('/api/investments/collect/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const inv = await pool.query(
      'SELECT * FROM investments WHERE id=$1 AND user_id=$2 AND status=$3',
      [id, userId, 'active']
    );
    if (!inv.rows.length) return res.status(404).json({ error: 'Investment not found' });
    const { daily_earnings, last_collected_at, start_date, end_date } = inv.rows[0];
    const now = new Date();
    const endDate = new Date(end_date);
    if (now > endDate) return res.status(400).json({ error: 'Investment period has ended' });
    const lastCollect = last_collected_at ? new Date(last_collected_at) : new Date(start_date);
    const nextCollect = new Date(lastCollect.getTime() + 24 * 60 * 60 * 1000);
    if (now < nextCollect) {
      return res.status(400).json({ error: 'Next collection available at ' + nextCollect.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }) });
    }
    const earnings = parseFloat(daily_earnings) || 0;
    await pool.query('UPDATE profiles SET account_balance = COALESCE(account_balance,0) + $1 WHERE user_id=$2', [earnings, userId]);
    await pool.query('UPDATE investments SET last_collected_at=NOW() WHERE id=$1', [id]);
    const prof = await pool.query('SELECT account_balance FROM profiles WHERE user_id=$1', [userId]);
    res.json({ success: true, collected: earnings, account_balance: parseFloat(prof.rows[0].account_balance || 0) });
  } catch (e) {
    console.error('Collect error:', e);
    res.status(500).json({ error: 'Collection failed' });
  }
});

app.post('/api/invest', requireAuth, async (req, res) => {
  const { product_name, amount, daily_earnings, hold_period, balance_source } = req.body;
  const userId = req.user.id;
  if (!product_name || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Product name and a valid amount are required' });
  }
  const cost = parseFloat(amount);
  const source = (balance_source === 'income') ? 'income' : 'wallet';
  try {
    const profRes = await pool.query(
      'SELECT account_balance, COALESCE(wallet_balance,0) AS wallet_balance FROM profiles WHERE user_id=$1',
      [userId]
    );
    if (!profRes.rows.length) return res.status(404).json({ error: 'Profile not found' });
    const income = parseFloat(profRes.rows[0].account_balance || 0);
    const wallet = parseFloat(profRes.rows[0].wallet_balance || 0);

    if (source === 'wallet') {
      if (wallet < cost) {
        return res.status(400).json({
          error: `Insufficient deposited balance. You need KES ${cost.toLocaleString()} but your deposit balance is KES ${wallet.toLocaleString()}`
        });
      }
      await pool.query(
        `UPDATE profiles SET wallet_balance = COALESCE(wallet_balance,0) - $1, updated_at = NOW() WHERE user_id = $2`,
        [cost, userId]
      );
    } else {
      if (income < cost) {
        return res.status(400).json({
          error: `Insufficient earnings balance. You need KES ${cost.toLocaleString()} but your earnings balance is KES ${income.toLocaleString()}`
        });
      }
      await pool.query(
        `UPDATE profiles SET account_balance = account_balance - $1, updated_at = NOW() WHERE user_id = $2`,
        [cost, userId]
      );
    }

    const holdDays = parseInt(hold_period) || 30;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + holdDays);
    const inv = await pool.query(
      `INSERT INTO investments (user_id, product_name, amount, daily_earnings, start_date, end_date, status, balance_source)
       VALUES ($1, $2, $3, $4, NOW(), $5, 'active', $6) RETURNING *`,
      [userId, product_name, cost, parseFloat(daily_earnings) || 0, endDate, source]
    );
    const newBal = await pool.query(
      'SELECT account_balance, COALESCE(wallet_balance,0) AS wallet_balance FROM profiles WHERE user_id=$1',
      [userId]
    );
    res.json({
      success: true,
      investment: inv.rows[0],
      income_balance: parseFloat(newBal.rows[0].account_balance || 0),
      wallet_balance: parseFloat(newBal.rows[0].wallet_balance || 0)
    });
  } catch (e) {
    console.error('Invest error:', e);
    res.status(500).json({ error: 'Investment failed. Please try again.' });
  }
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ products: result.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/active', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE disabled = FALSE ORDER BY price ASC');
    res.json({ products: result.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/admin/products', requireAnyAdmin, requireProductPermission('product_add'), async (req, res) => {
  const { name, description, price, daily_return, duration_days, image_url, category } = req.body;
  if (!name || price == null || !daily_return || !duration_days) {
    return res.status(400).json({ error: 'name, price, daily_return, and duration_days are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, daily_return, duration_days, image_url, category, disabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE) RETURNING *`,
      [name, description || '', parseFloat(price), parseFloat(daily_return), parseInt(duration_days), image_url || '', category || 'General']
    );
    res.json({ success: true, product: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/admin/products/:id', requireAnyAdmin, requireProductPermission('product_edit'), async (req, res) => {
  const { name, description, price, daily_return, duration_days, image_url, category } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, description=$2, price=$3, daily_return=$4, duration_days=$5, image_url=$6, category=$7 WHERE id=$8 RETURNING *`,
      [name, description || '', parseFloat(price), parseFloat(daily_return), parseInt(duration_days), image_url || '', category || 'General', req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, product: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.patch('/api/admin/products/:id/toggle', requireAnyAdmin, async (req, res) => {
  try {
    const current = await pool.query('SELECT disabled FROM products WHERE id=$1', [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: 'Product not found' });
    const requiredPerm = current.rows[0].disabled ? 'product_enable' : 'product_disable';
    if (!req.isSuperAdmin) {
      const privs = (req.subAdmin && req.subAdmin.privileges) || [];
      if (!privs.includes('product')) return res.status(403).json({ error: 'Product access not granted' });
      const pp = ((req.subAdmin && req.subAdmin.privilege_limits) || {}).product_permissions || [];
      if (pp.length > 0 && !pp.includes(requiredPerm)) return res.status(403).json({ error: 'You do not have ' + requiredPerm.replace('product_','') + ' permission for products' });
    }
    const result = await pool.query(
      `UPDATE products SET disabled = NOT disabled WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, product: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to toggle product' });
  }
});

app.delete('/api/admin/products/:id', requireAnyAdmin, requireProductPermission('product_delete'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── Legacy endpoints (backward compat) ──────────────────────────────────────
app.get('/api/users/lookup', async (req, res) => {
  const { identifier } = req.query;
  try {
    const result = await pool.query(
      'SELECT email FROM users WHERE phone = $1 OR username = $1 LIMIT 1',
      [identifier]
    );
    res.json({ email: result.rows[0]?.email || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/sync', async (req, res) => {
  const { id, email, username, phone } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (id, email, username, phone) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET email = $2, username = $3, phone = $4',
      [id, email, username, phone]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN MANAGEMENT ────────────────────────────────────────────────────────
// Middleware: verify super admin (checks localStorage marker via header)
function requireSuperAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.SUPER_ADMIN_KEY && key !== '1540568e') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

async function requireAnyAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key) return res.status(401).json({ error: 'Admin key required' });
  if (key === (process.env.SUPER_ADMIN_KEY || '1540568e')) {
    req.isSuperAdmin = true;
    return next();
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM admin_invites WHERE api_key=$1 AND status=$2',
      [key, 'active']
    );
    if (!rows.length) return res.status(403).json({ error: 'Invalid or inactive admin key' });
    req.subAdmin = rows[0];
    return next();
  } catch (e) {
    res.status(500).json({ error: 'Auth error' });
  }
}

function requireProductPermission(permission) {
  return function(req, res, next) {
    if (req.isSuperAdmin) return next();
    if (!req.subAdmin) return res.status(403).json({ error: 'Access denied' });
    const privs = req.subAdmin.privileges || [];
    if (!privs.includes('product')) return res.status(403).json({ error: 'Product access not granted' });
    const pl = req.subAdmin.privilege_limits || {};
    const pp = pl.product_permissions || [];
    if (pp.length === 0 || pp.includes(permission)) return next();
    return res.status(403).json({ error: 'You do not have ' + permission.replace('product_','') + ' permission for products' });
  };
}

app.get('/api/admin/my-permissions', requireAnyAdmin, async (req, res) => {
  if (req.isSuperAdmin) return res.json({ isSuperAdmin: true, privileges: ['all'], product_permissions: ['product_view','product_add','product_edit','product_delete','product_enable','product_disable'] });
  const admin = req.subAdmin;
  const pl = admin.privilege_limits || {};
  res.json({ isSuperAdmin: false, privileges: admin.privileges || [], product_permissions: pl.product_permissions || [], name: admin.name });
});

// Create admin invite
app.post('/api/admin/invite', requireSuperAdmin, async (req, res) => {
  const { name, email, phone, password, api_key, privileges, status, expires_at, exchange_limit, privilege_limits } = req.body;
  if (!name || !email || !password || !api_key || !privileges || !expires_at) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const exists = await pool.query('SELECT id FROM admin_invites WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'An admin with this email already exists' });
    }
    const token = crypto.randomBytes(8).toString('hex').toUpperCase();
    const password_hash = await bcrypt.hash(password, 12);
    const exLimit = parseFloat(exchange_limit) || 0;
    const privLimits = privilege_limits && typeof privilege_limits === 'object' ? privilege_limits : {};
    const result = await pool.query(
      `INSERT INTO admin_invites (token, name, email, phone, password_hash, api_key, privileges, status, expires_at, created_by, exchange_limit, exchange_generated, privilege_limits)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0,$12) RETURNING id, token, name, email, privileges, status, expires_at, created_at, exchange_limit, exchange_generated, privilege_limits`,
      [token, name, email, phone || null, password_hash, api_key, JSON.stringify(privileges), status || 'active', new Date(expires_at), 'superadmin', exLimit, JSON.stringify(privLimits)]
    );
    res.json({ invite: result.rows[0] });
  } catch (e) {
    console.error('Admin invite error:', e);
    res.status(500).json({ error: 'Failed to create admin invite' });
  }
});

// List all admin invites
app.get('/api/admin/invites', requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, token, name, email, phone, privileges, status, expires_at, created_at, last_login, exchange_limit, exchange_generated, privilege_limits FROM admin_invites ORDER BY created_at DESC'
    );
    res.json({ admins: result.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to list admins' });
  }
});

// Delete / revoke admin invite
app.delete('/api/admin/invite/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM admin_invites WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// Update admin status, privileges, exchange_limit, or privilege_limits
app.put('/api/admin/invite/:id', requireSuperAdmin, async (req, res) => {
  const { status, privileges, exchange_limit, privilege_limits } = req.body;
  try {
    await pool.query(
      `UPDATE admin_invites
       SET status           = COALESCE($1, status),
           privileges       = COALESCE($2, privileges),
           exchange_limit   = COALESCE($3, exchange_limit),
           privilege_limits = COALESCE($4, privilege_limits)
       WHERE id = $5`,
      [status || null,
       privileges ? JSON.stringify(privileges) : null,
       exchange_limit !== undefined ? parseFloat(exchange_limit) : null,
       privilege_limits ? JSON.stringify(privilege_limits) : null,
       req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// ─── EXCHANGE LIMIT (for sub-admins) ─────────────────────────────────────────
// Middleware to authenticate sub-admin via api_key header
async function requireSubAdmin(req, res, next) {
  const apiKey = req.headers['x-admin-key'];
  if (!apiKey) return res.status(401).json({ error: 'Admin API key required' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM admin_invites WHERE api_key = $1 AND status = $2',
      [apiKey, 'active']
    );
    if (!rows.length) return res.status(403).json({ error: 'Invalid or inactive admin key' });
    req.subAdmin = rows[0];
    next();
  } catch (e) {
    res.status(500).json({ error: 'Auth error' });
  }
}

// Get sub-admin's exchange limit and usage
app.get('/api/admin/exchange-limit', requireSubAdmin, async (req, res) => {
  const a = req.subAdmin;
  const limit = parseFloat(a.exchange_limit || 0);
  const generated = parseFloat(a.exchange_generated || 0);
  const remaining = Math.max(0, limit - generated);
  const hasLimit = limit > 0;
  res.json({ limit, generated, remaining, has_limit: hasLimit });
});

// Record exchange generation — enforces the limit server-side
app.post('/api/admin/exchange-usage', requireSubAdmin, async (req, res) => {
  const { amount } = req.body;
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const a = req.subAdmin;
  const limit = parseFloat(a.exchange_limit || 0);
  const generated = parseFloat(a.exchange_generated || 0);

  if (limit > 0 && generated + amt > limit) {
    const remaining = Math.max(0, limit - generated);
    return res.status(403).json({
      error: `Exceeds your exchange limit. Remaining: KES ${remaining.toLocaleString()}`,
      remaining
    });
  }

  await pool.query(
    'UPDATE admin_invites SET exchange_generated = exchange_generated + $1 WHERE id = $2',
    [amt, a.id]
  );
  const newGenerated = generated + amt;
  const remaining = limit > 0 ? Math.max(0, limit - newGenerated) : null;
  res.json({ success: true, generated: newGenerated, remaining });
});

// Super admin: reset an admin's exchange usage
app.post('/api/admin/exchange-reset/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE admin_invites SET exchange_generated = 0 WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reset' });
  }
});

// ─── SUB-ADMIN CHARGING ───────────────────────────────────────────────────────
// Credit or debit a sub-admin's exchange limit
app.post('/api/admin/charge-sub-admin/:id', requireSuperAdmin, async (req, res) => {
  const { amount, type, reason } = req.body;
  const id = parseInt(req.params.id);
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!['credit', 'debit'].includes(type)) return res.status(400).json({ error: 'type must be credit or debit' });

  try {
    const { rows } = await pool.query('SELECT id, name, exchange_limit FROM admin_invites WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Sub-admin not found' });

    const currentLimit = parseFloat(rows[0].exchange_limit || 0);
    let newLimit;
    if (type === 'credit') {
      newLimit = currentLimit + amt;
    } else {
      newLimit = Math.max(0, currentLimit - amt);
    }

    await pool.query('UPDATE admin_invites SET exchange_limit = $1 WHERE id = $2', [newLimit, id]);
    await pool.query(
      'INSERT INTO sub_admin_charges (admin_invite_id, amount, type, reason) VALUES ($1, $2, $3, $4)',
      [id, amt, type, reason || null]
    );

    res.json({ success: true, new_limit: newLimit, type, amount: amt, name: rows[0].name });
  } catch (e) {
    console.error('Charge sub-admin error:', e);
    res.status(500).json({ error: 'Failed to apply charge' });
  }
});

// Get charge history for a sub-admin
app.get('/api/admin/charge-history/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.amount, c.type, c.reason, c.created_at, a.name
       FROM sub_admin_charges c
       JOIN admin_invites a ON a.id = c.admin_invite_id
       WHERE c.admin_invite_id = $1
       ORDER BY c.created_at DESC LIMIT 50`,
      [req.params.id]
    );
    const totals = rows.reduce((acc, r) => {
      if (r.type === 'credit') acc.total_credited += parseFloat(r.amount);
      else acc.total_debited += parseFloat(r.amount);
      return acc;
    }, { total_credited: 0, total_debited: 0 });
    res.json({ charges: rows, ...totals });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch charge history' });
  }
});

// Set admin page session cookie (called after successful admin auth)
app.post('/api/admin/set-page-session', async (req, res) => {
  const { key } = req.body;
  const isSuper = key === (process.env.SUPER_ADMIN_KEY || '1540568e');
  if (!isSuper) {
    try {
      const { rows } = await pool.query('SELECT id FROM admin_invites WHERE api_key=$1 AND status=$2', [key, 'active']);
      if (!rows.length) return res.status(403).json({ error: 'Invalid key' });
    } catch (e) { return res.status(500).json({ error: 'Server error' }); }
  }
  res.cookie('_abAdmin', ADMIN_PAGE_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
    sameSite: 'strict'
  });
  res.json({ ok: true });
});

// Clear admin page session cookie
app.post('/api/admin/clear-page-session', (req, res) => {
  res.clearCookie('_abAdmin');
  res.json({ ok: true });
});

// ─── ADMIN PIN VERIFY & MANAGEMENT ───────────────────────────────────────────
const _pinAttempts = new Map();

app.post('/api/admin/verify-pin', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  let att = _pinAttempts.get(ip) || { count: 0, resetAt: now + 5 * 60 * 1000 };
  if (now > att.resetAt) att = { count: 0, resetAt: now + 5 * 60 * 1000 };
  if (att.count >= 5) {
    return res.status(429).json({ ok: false, error: 'Too many attempts. Try again in a few minutes.' });
  }
  const key = req.headers['x-admin-key'];
  const { pin } = req.body;
  if (!pin || !key) return res.status(400).json({ ok: false, error: 'Missing pin or key' });
  const superKey = process.env.SUPER_ADMIN_KEY || '1540568e';
  let isSuper = key === superKey;
  let isValidAdmin = isSuper;
  if (!isSuper) {
    try {
      const { rows } = await pool.query('SELECT id FROM admin_invites WHERE api_key=$1 AND status=$2', [key, 'active']);
      isValidAdmin = rows.length > 0;
    } catch (e) { isValidAdmin = false; }
  }
  if (!isValidAdmin) {
    att.count++;
    _pinAttempts.set(ip, att);
    return res.status(403).json({ ok: false, error: 'Invalid admin key' });
  }
  const settingKey = isSuper ? 'admin_pin_super' : 'admin_pin_sub';
  const defaultPin  = isSuper ? '1540' : '1212';
  let storedPin = defaultPin;
  try {
    const { rows } = await pool.query('SELECT value FROM system_settings WHERE key=$1', [settingKey]);
    if (rows.length) storedPin = rows[0].value;
  } catch (e) {}
  if (pin === storedPin) {
    _pinAttempts.delete(ip);
    return res.json({ ok: true });
  } else {
    att.count++;
    _pinAttempts.set(ip, att);
    return res.json({ ok: false });
  }
});

app.get('/api/admin/pins', requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT key, value FROM system_settings WHERE key IN ('admin_pin_super','admin_pin_sub')");
    const result = { superPin: '1540', subPin: '1212' };
    rows.forEach(r => {
      if (r.key === 'admin_pin_super') result.superPin = r.value;
      if (r.key === 'admin_pin_sub')   result.subPin   = r.value;
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pins' });
  }
});

app.post('/api/admin/pins', requireSuperAdmin, async (req, res) => {
  const { superPin, subPin } = req.body;
  if (!superPin || !subPin) return res.status(400).json({ error: 'Both PINs are required' });
  if (!/^\d{4}$/.test(superPin) || !/^\d{4}$/.test(subPin)) {
    return res.status(400).json({ error: 'Each PIN must be exactly 4 digits' });
  }
  try {
    const up = (k, v) => pool.query(
      'INSERT INTO system_settings (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()',
      [k, v]
    );
    await Promise.all([up('admin_pin_super', superPin), up('admin_pin_sub', subPin)]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update pins' });
  }
});

// Validate admin login via token
app.post('/api/admin/login', async (req, res) => {
  const { token, email, password, api_key, security_code, expected_code } = req.body;
  if (!token || !email || !password || !api_key) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM admin_invites WHERE token = $1 AND status = $2',
      [token, 'active']
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid or expired invite token' });
    const admin = result.rows[0];
    if (new Date(admin.expires_at) < new Date()) {
      return res.status(401).json({ error: 'This invite link has expired' });
    }
    if (admin.email !== email) return res.status(401).json({ error: 'Incorrect email' });
    const pwOk = await bcrypt.compare(password, admin.password_hash);
    if (!pwOk) return res.status(401).json({ error: 'Incorrect password' });
    if (admin.api_key !== api_key) return res.status(401).json({ error: 'Incorrect API key' });
    if (security_code && expected_code && security_code.toUpperCase() !== expected_code.toUpperCase()) {
      return res.status(401).json({ error: 'Incorrect security code' });
    }
    await pool.query('UPDATE admin_invites SET last_login = NOW() WHERE id = $1', [admin.id]);
    res.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        privileges: admin.privileges,
        exchange_limit: parseFloat(admin.exchange_limit || 0),
        exchange_generated: parseFloat(admin.exchange_generated || 0),
        privilege_limits: admin.privilege_limits || {}
      }
    });
  } catch (e) {
    console.error('Admin login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── INTASEND STK PUSH ──────────────────────────────────────────────────────
const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY || '';
const INTASEND_SECRET_KEY      = process.env.INTASEND_SECRET_KEY      || '';
const INTASEND_TEST_MODE       = process.env.INTASEND_ENV !== 'production';
const INTASEND_BASE            = INTASEND_TEST_MODE
  ? 'https://sandbox.intasend.com'
  : 'https://payment.intasend.com';

function normalizeMpesaPhone(phone) {
  phone = String(phone).replace(/\s+/g, '');
  if (phone.startsWith('+')) phone = phone.slice(1);
  if (phone.startsWith('07') || phone.startsWith('01')) phone = '254' + phone.slice(1);
  if (!phone.startsWith('254')) phone = '254' + phone;
  return phone;
}

function getIntaSend() {
  return new IntaSend(INTASEND_PUBLISHABLE_KEY, INTASEND_SECRET_KEY, INTASEND_TEST_MODE);
}

async function getSystemSetting(key) {
  const { rows } = await pool.query('SELECT value FROM system_settings WHERE key=$1', [key]);
  return rows[0]?.value || 'auto';
}

// ─── MANUAL DEPOSIT SUBMISSION (user submits M-Pesa message for admin review) ─
app.post('/api/deposits/manual', requireAuth, async (req, res) => {
  const { amount, mpesa_message, phone_or_account } = req.body;
  const userId = req.user.id;
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt < 10) return res.status(400).json({ error: 'Minimum deposit amount is KES 10' });
  const reference = (mpesa_message || '').trim() || (phone_or_account || '').trim();
  if (!reference) return res.status(400).json({ error: 'M-Pesa message is required' });
  try {
    // Prevent duplicate submissions (same reference by same user)
    const { rows: dup } = await pool.query(
      "SELECT id FROM deposits WHERE user_id = $1 AND reference = $2 AND status != 'rejected'",
      [userId, reference]
    );
    if (dup.length) return res.status(400).json({ error: 'This M-Pesa message has already been submitted.' });
    const { rows } = await pool.query(
      `INSERT INTO deposits (user_id, amount, method, status, reference, deposited_at)
       VALUES ($1, $2, 'manual', 'pending_review', $3, NOW()) RETURNING id`,
      [userId, amt, reference]
    );
    res.json({ success: true, id: rows[0].id, message: 'Deposit submitted. We will review and credit your account shortly.' });

    // Notify user by email
    const u = await pool.query('SELECT username, email FROM users WHERE id=$1', [userId]);
    if (u.rows.length && u.rows[0].email) {
      sendMail({ to: u.rows[0].email, subject: 'Deposit Received – Under Review', html: depositReceivedEmailHtml(u.rows[0].username, amt) });
    }
  } catch (e) {
    console.error('Manual deposit error:', e);
    res.status(500).json({ error: 'Failed to submit deposit. Please try again.' });
  }
});

// Initiate STK Push
app.post('/api/mpesa/stkpush', requireAuth, async (req, res) => {
  if (!INTASEND_PUBLISHABLE_KEY || !INTASEND_SECRET_KEY) {
    return res.status(503).json({ error: 'Payment gateway is not configured yet. Please contact support.' });
  }
  const { phone, amount } = req.body;
  if (!phone || !amount || isNaN(Number(amount)) || Number(amount) < 1) {
    return res.status(400).json({ error: 'Valid phone number and amount are required.' });
  }
  const normalizedPhone = normalizeMpesaPhone(phone);
  const intAmount = Math.ceil(Number(amount));
  const user = req.user;
  try {
    const intasend   = getIntaSend();
    const collection = intasend.collection();
    const nameParts  = (user.username || 'Customer').split(' ');
    const firstName  = nameParts[0] || 'Customer';
    const lastName   = nameParts.slice(1).join(' ') || '.';
    const resp = await collection.mpesaStkPush({
      first_name:   firstName,
      last_name:    lastName,
      email:        user.email || 'noreply@africabased.com',
      host:         process.env.REPLIT_DOMAINS
                      ? 'https://' + process.env.REPLIT_DOMAINS.split(',')[0]
                      : 'https://africabased.com',
      amount:       intAmount,
      phone_number: normalizedPhone,
      api_ref:      'DEP-' + user.id + '-' + Date.now(),
    });
    const invoiceId = resp.invoice?.invoice_id || resp.id || resp.invoice_id;
    await pool.query(
      'INSERT INTO deposits (user_id, amount, method, status, reference) VALUES ($1,$2,$3,$4,$5)',
      [user.id, intAmount, 'mpesa', 'pending', invoiceId]
    );
    res.json({ success: true, invoiceId, message: 'M-Pesa prompt sent! Please check your phone and enter your PIN.' });
  } catch (e) {
    console.error('IntaSend STK Push error:', e);
    const msg = e?.response?.data?.detail || e?.message || 'Failed to initiate M-Pesa payment';
    res.status(500).json({ error: msg });
  }
});

// Helper: confirm a deposit (credit balance if auto mode)
async function confirmDeposit(invoiceId, mpesaCode) {
  const dep = await pool.query('SELECT * FROM deposits WHERE reference=$1 LIMIT 1', [invoiceId]);
  if (!dep.rows.length) return;
  const { user_id, amount, status } = dep.rows[0];
  if (status === 'confirmed' || status === 'pending_review') return; // already handled
  const mode = await getSystemSetting('deposit_mode');
  if (mode === 'manual') {
    await pool.query('UPDATE deposits SET status=$1, reference=$2 WHERE reference=$3', ['pending_review', mpesaCode, invoiceId]);
    const u = await pool.query('SELECT username, email FROM users WHERE id=$1', [user_id]);
    if (u.rows.length && u.rows[0].email) {
      sendMail({ to: u.rows[0].email, subject: 'Deposit Received – Under Review', html: depositReceivedEmailHtml(u.rows[0].username, amount) });
    }
  } else {
    await pool.query('UPDATE deposits SET status=$1, reference=$2 WHERE reference=$3', ['confirmed', mpesaCode, invoiceId]);
    await pool.query('UPDATE profiles SET wallet_balance = COALESCE(wallet_balance,0) + $1 WHERE user_id = $2', [amount, user_id]);
    const u = await pool.query('SELECT username, email FROM users WHERE id=$1', [user_id]);
    if (u.rows.length && u.rows[0].email) {
      sendMail({ to: u.rows[0].email, subject: 'Deposit Confirmed – Balance Updated', html: depositConfirmedEmailHtml(u.rows[0].username, amount) });
    }
  }
}

// IntaSend webhook
app.post('/api/mpesa/callback', async (req, res) => {
  res.sendStatus(200);
  try {
    const payload   = req.body;
    const invoiceId = payload?.invoice?.invoice_id || payload?.invoice_id;
    const state     = payload?.invoice?.state || payload?.state || '';
    if (!invoiceId) return;
    if (state === 'COMPLETE') {
      const mpesaCode = payload?.invoice?.mpesa_reference || invoiceId;
      await confirmDeposit(invoiceId, mpesaCode);
    } else if (state === 'FAILED' || state === 'CANCELLED') {
      await pool.query('UPDATE deposits SET status=$1 WHERE reference=$2', ['failed', invoiceId]);
    }
  } catch (e) {
    console.error('IntaSend callback error:', e);
  }
});

// Poll payment status
app.get('/api/mpesa/status/:invoiceId', requireAuth, async (req, res) => {
  const { invoiceId } = req.params;
  try {
    const db = await pool.query(
      'SELECT status, reference FROM deposits WHERE reference=$1 AND user_id=$2 ORDER BY deposited_at DESC LIMIT 1',
      [invoiceId, req.user.id]
    );
    const row = db.rows[0];
    if (row && (row.status === 'confirmed' || row.status === 'failed' || row.status === 'pending_review')) {
      return res.json({ status: row.status, mpesaCode: row.reference });
    }
    const r = await fetch(`${INTASEND_BASE}/api/v1/payment/collection/${invoiceId}/`, {
      headers: {
        Authorization:               `Bearer ${INTASEND_SECRET_KEY}`,
        'X-IntaSend-Public-API-Key': INTASEND_PUBLISHABLE_KEY,
      }
    });
    if (!r.ok) return res.json({ status: 'pending' });
    const data  = await r.json();
    const state = data?.invoice?.state || data?.state || 'PENDING';
    if (state === 'COMPLETE') {
      const mpesaCode = data?.invoice?.mpesa_reference || invoiceId;
      await confirmDeposit(invoiceId, mpesaCode);
      const newStatus = await getSystemSetting('deposit_mode') === 'manual' ? 'pending_review' : 'confirmed';
      return res.json({ status: newStatus, mpesaCode });
    } else if (state === 'FAILED' || state === 'CANCELLED') {
      await pool.query('UPDATE deposits SET status=$1 WHERE reference=$2', ['failed', invoiceId]);
      return res.json({ status: 'failed' });
    }
    res.json({ status: 'pending' });
  } catch (e) {
    console.error('Status check error:', e);
    res.json({ status: 'pending' });
  }
});

// ─── REFERRAL ─────────────────────────────────────────────────────────────────
app.get('/api/referral', requireAuth, async (req, res) => {
  try {
    let { referral_code } = req.user;
    if (!referral_code) {
      referral_code = (req.user.id.slice(0, 6) + crypto.randomBytes(3).toString('hex')).toUpperCase();
      await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [referral_code, req.user.id]);
    }
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const baseUrl = process.env.APP_URL || `${proto}://${req.headers.host}`;
    const referralLink = `${baseUrl}/?ref=${referral_code}`;

    // ── helper: fetch downline users at a given depth ──────────────────────────
    async function fetchDownlineLevel(parentCodes) {
      if (!parentCodes || parentCodes.length === 0) return [];
      const { rows } = await pool.query(
        `SELECT u.id, u.username, u.email, u.created_at, u.referral_code, u.referred_by,
           COALESCE((SELECT SUM(i.daily_earnings) FROM investments i WHERE i.user_id = u.id AND i.status = 'active'), 0) AS daily_earnings,
           (SELECT COUNT(*) FROM investments i WHERE i.user_id = u.id AND i.status = 'active') > 0 AS has_investment
         FROM users u WHERE u.referred_by = ANY($1) ORDER BY u.created_at DESC`,
        [parentCodes]
      );
      return rows;
    }

    // L1 — direct referrals
    const l1Users = await fetchDownlineLevel([referral_code]);
    // L2 — referrals of L1
    const l1Codes = l1Users.filter(u => u.referral_code).map(u => u.referral_code);
    const l2Users = await fetchDownlineLevel(l1Codes);
    // L3 — referrals of L2
    const l2Codes = l2Users.filter(u => u.referral_code).map(u => u.referral_code);
    const l3Users = await fetchDownlineLevel(l2Codes);

    const { rows: selfRows } = await pool.query(
      `SELECT COUNT(*) > 0 AS has_investment FROM investments WHERE user_id = $1 AND status = 'active'`,
      [req.user.id]
    );
    const hasInvestment = selfRows[0]?.has_investment || false;

    const activeL1 = l1Users.filter(u => u.has_investment).length;
    // Membership level based on active direct (L1) downlines
    let membershipLevel = 'Inactive';
    if (hasInvestment) {
      if (activeL1 >= 300)     membershipLevel = 'Gold';
      else if (activeL1 >= 60) membershipLevel = 'Premium';
      else if (activeL1 >= 5)  membershipLevel = 'Basic';
      else                     membershipLevel = 'Active';
    }

    // Commission only starts at Basic (5+ active direct downlines)
    // L1=10%, L2=6%, L3=1% — Active earns 0%
    const isEligible = hasInvestment && activeL1 >= 5;
    const L1_RATE = isEligible ? 10 : 0;
    const L2_RATE = isEligible ? 6  : 0;
    const L3_RATE = isEligible ? 1  : 0;

    const l1DailyTotal = l1Users.filter(u => u.has_investment).reduce((s, u) => s + (parseFloat(u.daily_earnings) || 0), 0);
    const l2DailyTotal = l2Users.filter(u => u.has_investment).reduce((s, u) => s + (parseFloat(u.daily_earnings) || 0), 0);
    const l3DailyTotal = l3Users.filter(u => u.has_investment).reduce((s, u) => s + (parseFloat(u.daily_earnings) || 0), 0);

    const l1Commission = l1DailyTotal * L1_RATE / 100;
    const l2Commission = l2DailyTotal * L2_RATE / 100;
    const l3Commission = l3DailyTotal * L3_RATE / 100;
    const totalDailyCommission = l1Commission + l2Commission + l3Commission;

    const { rows: profileRows } = await pool.query(
      'SELECT last_commission_collected_at, COALESCE(total_commission_earned, 0) AS total_commission_earned FROM profiles WHERE user_id = $1', [req.user.id]
    );
    const lastCollected = profileRows[0]?.last_commission_collected_at || null;
    const totalCommissionEarned = parseFloat(profileRows[0]?.total_commission_earned || 0);

    res.json({
      referral_code,
      referral_link: referralLink,
      referred_users: l1Users,
      l2_users: l2Users,
      l3_users: l3Users,
      has_investment: hasInvestment,
      active_referrals: activeL1,
      membership_level: membershipLevel,
      is_eligible: isEligible,
      total_commission_earned: totalCommissionEarned,
      levels: {
        l1: { count: l1Users.length, active: activeL1, daily_total: l1DailyTotal, rate: L1_RATE, commission: l1Commission },
        l2: { count: l2Users.length, active: l2Users.filter(u => u.has_investment).length, daily_total: l2DailyTotal, rate: L2_RATE, commission: l2Commission },
        l3: { count: l3Users.length, active: l3Users.filter(u => u.has_investment).length, daily_total: l3DailyTotal, rate: L3_RATE, commission: l3Commission }
      },
      total_daily_commission: totalDailyCommission,
      last_commission_collected_at: lastCollected
    });
  } catch (e) {
    console.error('Referral error:', e);
    res.status(500).json({ error: 'Failed to get referral info' });
  }
});

app.post('/api/referral/collect', requireAuth, async (req, res) => {
  try {
    let { referral_code } = req.user;
    if (!referral_code) return res.status(400).json({ error: 'No referral code' });

    const { rows: profileRows } = await pool.query(
      'SELECT last_commission_collected_at FROM profiles WHERE user_id = $1', [req.user.id]
    );
    const lastCollected = profileRows[0]?.last_commission_collected_at;
    if (lastCollected) {
      const hoursSince = (Date.now() - new Date(lastCollected).getTime()) / 3600000;
      if (hoursSince < 24) {
        const nextTime = new Date(new Date(lastCollected).getTime() + 86400000);
        return res.status(400).json({ error: `Commission already collected. Next collection available at ${nextTime.toLocaleString()}` });
      }
    }

    const { rows: selfRows } = await pool.query(
      `SELECT COUNT(*) > 0 AS has_investment FROM investments WHERE user_id = $1 AND status = 'active'`,
      [req.user.id]
    );
    const hasInvestment = selfRows[0]?.has_investment || false;
    if (!hasInvestment) return res.status(400).json({ error: 'You need an active investment to earn commission' });

    // fetch 3 levels
    async function fetchLevel(parentCodes) {
      if (!parentCodes || parentCodes.length === 0) return [];
      const { rows } = await pool.query(
        `SELECT u.id, u.referral_code,
           COALESCE((SELECT SUM(i.daily_earnings) FROM investments i WHERE i.user_id = u.id AND i.status = 'active'), 0) AS daily_earnings,
           (SELECT COUNT(*) FROM investments i WHERE i.user_id = u.id AND i.status = 'active') > 0 AS has_investment
         FROM users u WHERE u.referred_by = ANY($1)`,
        [parentCodes]
      );
      return rows;
    }
    const l1 = await fetchLevel([referral_code]);
    const l2 = await fetchLevel(l1.filter(u => u.referral_code).map(u => u.referral_code));
    const l3 = await fetchLevel(l2.filter(u => u.referral_code).map(u => u.referral_code));

    const activeL1 = l1.filter(u => u.has_investment).length;
    if (activeL1 < 5) return res.status(400).json({ error: 'You need at least 5 active direct referrals (Basic tier) to earn commission' });

    const l1Daily = l1.filter(u => u.has_investment).reduce((s, u) => s + (parseFloat(u.daily_earnings) || 0), 0);
    const l2Daily = l2.filter(u => u.has_investment).reduce((s, u) => s + (parseFloat(u.daily_earnings) || 0), 0);
    const l3Daily = l3.filter(u => u.has_investment).reduce((s, u) => s + (parseFloat(u.daily_earnings) || 0), 0);

    const commission = (l1Daily * 0.10) + (l2Daily * 0.06) + (l3Daily * 0.01);
    if (commission <= 0) return res.status(400).json({ error: 'No commission available — your downlines have no active investments generating income' });

    await pool.query(
      'UPDATE profiles SET account_balance = account_balance + $1, last_commission_collected_at = NOW(), total_commission_earned = total_commission_earned + $1 WHERE user_id = $2',
      [commission, req.user.id]
    );

    res.json({
      success: true,
      commission_credited: commission,
      breakdown: {
        l1: { count: l1.filter(u => u.has_investment).length, daily_total: l1Daily, rate: 10, commission: l1Daily * 0.10 },
        l2: { count: l2.filter(u => u.has_investment).length, daily_total: l2Daily, rate: 6,  commission: l2Daily * 0.06 },
        l3: { count: l3.filter(u => u.has_investment).length, daily_total: l3Daily, rate: 1,  commission: l3Daily * 0.01 }
      }
    });
  } catch (e) {
    console.error('Commission collect error:', e);
    res.status(500).json({ error: 'Failed to collect commission' });
  }
});

app.get('/api/admin/referrals', requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email, u.referral_code, u.created_at,
         (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.referral_code) AS total_referrals,
         (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.referral_code
           AND EXISTS (SELECT 1 FROM investments i WHERE i.user_id = r.id AND i.status = 'active')) AS active_referrals,
         (SELECT COUNT(*) FROM investments i WHERE i.user_id = u.id AND i.status = 'active') > 0 AS has_investment,
         p.last_commission_collected_at
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.referral_code IS NOT NULL
       ORDER BY total_referrals DESC, u.created_at DESC
       LIMIT 200`
    );
    res.json({ users: rows });
  } catch (e) {
    console.error('Admin referrals error:', e);
    res.status(500).json({ error: 'Failed to load referral data' });
  }
});

// ─── DUAL-WRITE SYNC: Mirror Supabase writes to Replit DB ─────────────────────
// Ensure the generic catch-all table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS sync_data (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(err => console.warn('sync_data table check failed:', err.message));

// Also ensure commonly synced tables exist
pool.query(`
  CREATE TABLE IF NOT EXISTS withdraw_requests (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS promotion_applications (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS service_tickets (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS reward_codes (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS admin_logins (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS remembered_logins (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(err => console.warn('Extra tables check failed:', err.message));

pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_commission_collected_at TIMESTAMPTZ`)
  .catch(err => console.warn('profiles migration:', err.message));
pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_commission_earned NUMERIC(14,2) NOT NULL DEFAULT 0`)
  .catch(err => console.warn('profiles commission migration:', err.message));
pool.query(`ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS paybill VARCHAR(30)`)
  .catch(err => console.warn('withdrawals paybill migration:', err.message));
pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mpesa_phone VARCHAR(15)`)
  .catch(err => console.warn('profiles mpesa_phone migration:', err.message));
pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100)`)
  .catch(err => console.warn('profiles bank_name migration:', err.message));
pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_paybill VARCHAR(20)`)
  .catch(err => console.warn('profiles bank_paybill migration:', err.message));
pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(30)`)
  .catch(err => console.warn('profiles bank_account_number migration:', err.message));
pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(100)`)
  .catch(err => console.warn('profiles bank_account_name migration:', err.message));

app.post('/api/sync', async (req, res) => {
  const { table, operation, data } = req.body;
  if (!table || !operation || !data) {
    return res.status(400).json({ error: 'table, operation, and data are required' });
  }

  try {
    // Always save to generic sync_data for full audit trail
    await pool.query(
      'INSERT INTO sync_data (table_name, operation, data) VALUES ($1, $2, $3)',
      [table, operation, JSON.stringify(data)]
    );

    // Also try to save to the matching specific table (JSONB based) if it exists
    const knownTables = [
      'withdraw_requests', 'promotion_applications', 'referrals',
      'service_tickets', 'reward_codes', 'admin_logins', 'remembered_logins'
    ];

    if (knownTables.includes(table)) {
      await pool.query(
        `INSERT INTO ${table} (data, synced_at) VALUES ($1, NOW())`,
        [JSON.stringify(data)]
      );
    }

    // For profiles table: also upsert into the typed profiles table
    if (table === 'profiles') {
      const d = Array.isArray(data) ? data[0] : data;
      if (d && (d.user_id || d.id)) {
        const uid = d.user_id || d.id;
        await pool.query(
          `INSERT INTO profiles (user_id, username, phone, email, avatar_url, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (user_id) DO UPDATE
           SET username = COALESCE(EXCLUDED.username, profiles.username),
               phone    = COALESCE(EXCLUDED.phone, profiles.phone),
               email    = COALESCE(EXCLUDED.email, profiles.email),
               avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
               updated_at = NOW()`,
          [uid, d.username || null, d.phone || null, d.email || null, d.avatar_url || null]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── WITHDRAWALS ──────────────────────────────────────────────────────────────
app.post('/api/withdraw/mpesa', requireAuth, async (req, res) => {
  const { amount, phone } = req.body;
  const userId = req.user.id;

  if (!amount || !phone) return res.status(400).json({ error: 'amount and phone are required' });
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt < 150) return res.status(400).json({ error: 'Minimum withdrawal is KES 150' });
  if (amt > 200000) return res.status(400).json({ error: 'Maximum withdrawal is KES 200,000' });

  // Normalise phone to 254XXXXXXXXX
  let normalised = String(phone).replace(/\s+/g, '');
  if (normalised.startsWith('0')) normalised = '254' + normalised.slice(1);
  if (normalised.startsWith('+')) normalised = normalised.slice(1);
  if (!/^254\d{9}$/.test(normalised)) return res.status(400).json({ error: 'Invalid M-Pesa phone number' });

  const fee = parseFloat((amt * 0.095).toFixed(2));
  const totalDeducted = parseFloat((amt + fee).toFixed(2));

  // Check user balance (balance lives in profiles.account_balance)
  const { rows: profRows } = await pool.query(
    'SELECT u.username, p.account_balance FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = $1',
    [userId]
  );
  if (!profRows.length) return res.status(404).json({ error: 'User not found' });
  const balance = parseFloat(profRows[0].account_balance || 0);
  if (balance < totalDeducted) return res.status(400).json({ error: `Insufficient balance. You need KES ${totalDeducted.toLocaleString()} (amount + 9.5% fee) but have KES ${balance.toLocaleString()}` });

  // Insert withdrawal record as pending
  const { rows: wRows } = await pool.query(
    `INSERT INTO withdrawals (user_id, amount, fee, phone, status, method, requested_at)
     VALUES ($1, $2, $3, $4, 'pending', 'mpesa', NOW()) RETURNING id`,
    [userId, amt, fee, normalised]
  );
  const withdrawalId = wRows[0].id;

  // Check withdrawal mode
  const withdrawalMode = await getSystemSetting('withdrawal_mode');
  if (withdrawalMode === 'manual') {
    // Hold balance and queue for admin approval
    await pool.query('UPDATE profiles SET account_balance = account_balance - $1 WHERE user_id = $2', [totalDeducted, userId]);
    if (req.user.email) {
      sendMail({ to: req.user.email, subject: 'Withdrawal Request Received', html: withdrawalRequestEmailHtml(req.user.username, amt, fee, 'mpesa') });
    }
    return res.json({ success: true, manual: true, amount: amt, fee, total_deducted: totalDeducted, message: 'Withdrawal request submitted. Admin will process it within 1 business day.' });
  }

  // Auto mode: attempt IntaSend payout
  const INTASEND_PUB = process.env.INTASEND_PUBLISHABLE_KEY;
  const INTASEND_SEC = process.env.INTASEND_SECRET_KEY;
  const IS_TEST = process.env.INTASEND_ENV !== 'production';

  if (!INTASEND_PUB || !INTASEND_SEC) {
    await pool.query('UPDATE withdrawals SET status=$1, notes=$2 WHERE id=$3', ['failed', 'IntaSend not configured', withdrawalId]);
    return res.status(500).json({ error: 'Payment gateway not configured' });
  }

  try {
    const IntaSend = _require('intasend-node');
    const sdk = new IntaSend(INTASEND_PUB, INTASEND_SEC, IS_TEST);
    const payouts = sdk.payouts();
    const nameParts = (profRows[0].username || 'User').split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const resp = await payouts.mpesa({
      currency: 'KES',
      requires_approval: 'NO',
      transactions: [{
        name: `${firstName} ${lastName}`.trim(),
        account: normalised,
        amount: String(Math.round(amt)),
        narrative: 'AfricaBased Withdrawal'
      }]
    });

    const trackingId = resp.tracking_id || resp.id || resp.file_id || null;

    // Deduct balance from profiles
    await pool.query('UPDATE profiles SET account_balance = account_balance - $1 WHERE user_id = $2', [totalDeducted, userId]);
    // Update withdrawal record
    await pool.query(
      'UPDATE withdrawals SET status=$1, tracking_id=$2, processed_at=NOW() WHERE id=$3',
      ['completed', String(trackingId || ''), withdrawalId]
    );

    if (req.user.email) {
      sendMail({ to: req.user.email, subject: 'Payment Sent – Withdrawal Successful', html: withdrawalPaidEmailHtml(req.user.username, amt, 'mpesa') });
    }
    return res.json({ success: true, tracking_id: trackingId, amount: amt, fee, total_deducted: totalDeducted });
  } catch (e) {
    console.error('IntaSend payout error:', e.message || e);
    await pool.query('UPDATE withdrawals SET status=$1, notes=$2 WHERE id=$3', ['failed', String(e.message || e).slice(0, 500), withdrawalId]);
    return res.status(502).json({ error: 'Payout failed: ' + (e.message || 'Unknown error') });
  }
});

app.get('/api/withdraw/history', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, amount, fee, phone, status, tracking_id, requested_at, processed_at, notes,
              method, bank_name, account_number, account_name
       FROM withdrawals WHERE user_id = $1 ORDER BY requested_at DESC LIMIT 30`,
      [req.user.id]
    );
    res.json({ withdrawals: rows });
  } catch (e) {
    console.error('Withdraw history error:', e);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─── BANK WITHDRAWAL ──────────────────────────────────────────────────────────
app.post('/api/withdraw/bank', requireAuth, async (req, res) => {
  const { amount, bank_name, account_number, account_name, paybill } = req.body;
  const userId = req.user.id;

  if (!amount || !bank_name || !account_number || !account_name) {
    return res.status(400).json({ error: 'amount, bank_name, account_number and account_name are required' });
  }
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt < 500) return res.status(400).json({ error: 'Minimum bank withdrawal is KES 500' });
  if (amt > 500000) return res.status(400).json({ error: 'Maximum bank withdrawal is KES 500,000' });

  const fee = parseFloat((amt * 0.095).toFixed(2));
  const totalDeducted = parseFloat((amt + fee).toFixed(2));

  // Check balance
  const { rows: profRows } = await pool.query(
    'SELECT p.account_balance FROM profiles p WHERE p.user_id = $1',
    [userId]
  );
  if (!profRows.length) return res.status(404).json({ error: 'User not found' });
  const balance = parseFloat(profRows[0].account_balance || 0);
  if (balance < totalDeducted) {
    return res.status(400).json({ error: `Insufficient balance. You need KES ${totalDeducted.toLocaleString()} but have KES ${balance.toLocaleString()}` });
  }

  try {
    // Deduct balance immediately and create pending record
    await pool.query('UPDATE profiles SET account_balance = account_balance - $1 WHERE user_id = $2', [totalDeducted, userId]);
    await pool.query(
      `INSERT INTO withdrawals (user_id, amount, fee, status, method, bank_name, account_number, account_name, paybill, requested_at)
       VALUES ($1, $2, $3, 'pending', 'bank', $4, $5, $6, $7, NOW())`,
      [userId, amt, fee, bank_name.trim(), account_number.trim(), account_name.trim(), (paybill || '').trim()]
    );
    if (req.user.email) {
      sendMail({ to: req.user.email, subject: 'Withdrawal Request Received', html: withdrawalRequestEmailHtml(req.user.username, amt, fee, 'bank') });
    }
    return res.json({ success: true, amount: amt, fee, total_deducted: totalDeducted, message: 'Bank transfer submitted. Processing takes 1–3 business days.' });
  } catch (e) {
    console.error('Bank withdrawal error:', e);
    return res.status(500).json({ error: 'Failed to submit bank withdrawal' });
  }
});

// ─── PUBLIC: DEPOSIT CONFIG (mode + instructions) ────────────────────────────
app.get('/api/deposit/config', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT key, value FROM system_settings WHERE key IN ('deposit_mode','deposit_instructions')"
    );
    const cfg = { mode: 'auto', instructions: '' };
    rows.forEach(r => {
      if (r.key === 'deposit_mode') cfg.mode = r.value;
      if (r.key === 'deposit_instructions') cfg.instructions = r.value;
    });
    res.json(cfg);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch deposit config' });
  }
});

// ─── PUBLIC: HOMEPAGE DATA ────────────────────────────────────────────────────
app.get('/api/homepage', async (req, res) => {
  try {
    const [settingsRes, statsRes] = await Promise.all([
      pool.query("SELECT key, value FROM system_settings WHERE key IN ('homepage_announcement','homepage_announcement_enabled','homepage_announcement_type')"),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users) AS total_users,
          (SELECT COUNT(*) FROM investments WHERE status = 'active') AS active_investments,
          (SELECT COALESCE(SUM(amount),0) FROM investments WHERE status = 'active') AS total_invested
      `)
    ]);
    const s = {};
    settingsRes.rows.forEach(r => { s[r.key] = r.value; });
    const stats = statsRes.rows[0];
    res.json({
      announcement: s.homepage_announcement || '',
      announcement_enabled: s.homepage_announcement_enabled === 'true',
      announcement_type: s.homepage_announcement_type || 'info',
      stats: {
        total_users: parseInt(stats.total_users) || 0,
        active_investments: parseInt(stats.active_investments) || 0,
        total_invested: parseFloat(stats.total_invested) || 0
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch homepage data' });
  }
});

// ─── ADMIN: SYSTEM MODES ────────────────────────────────────────────────────
app.get('/api/admin/settings/modes', requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT key, value FROM system_settings WHERE key IN ('deposit_mode','withdrawal_mode','deposit_instructions','homepage_announcement','homepage_announcement_enabled','homepage_announcement_type')");
    const modes = { deposit_mode: 'auto', withdrawal_mode: 'auto', deposit_instructions: '', homepage_announcement: '', homepage_announcement_enabled: 'false', homepage_announcement_type: 'info' };
    rows.forEach(r => { modes[r.key] = r.value; });
    res.json(modes);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch modes' });
  }
});

app.put('/api/admin/settings/modes', requireSuperAdmin, async (req, res) => {
  const { deposit_mode, withdrawal_mode, deposit_instructions, homepage_announcement, homepage_announcement_enabled, homepage_announcement_type } = req.body;
  const valid = ['auto', 'manual'];
  const upsert = (key, val) => pool.query('INSERT INTO system_settings (key, value, updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()', [key, val]);
  try {
    if (deposit_mode && valid.includes(deposit_mode)) await upsert('deposit_mode', deposit_mode);
    if (withdrawal_mode && valid.includes(withdrawal_mode)) await upsert('withdrawal_mode', withdrawal_mode);
    if (typeof deposit_instructions === 'string') await upsert('deposit_instructions', deposit_instructions.trim());
    if (typeof homepage_announcement === 'string') await upsert('homepage_announcement', homepage_announcement.trim());
    if (typeof homepage_announcement_enabled === 'string') await upsert('homepage_announcement_enabled', homepage_announcement_enabled);
    if (homepage_announcement_type && ['info','warning','success'].includes(homepage_announcement_type)) await upsert('homepage_announcement_type', homepage_announcement_type);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update modes' });
  }
});

// ─── PUBLIC: HOMEPAGE CATEGORIES ─────────────────────────────────────────────
app.get('/api/homepage/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM homepage_categories ORDER BY id ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/admin/homepage/categories', requireSuperAdmin, async (req, res) => {
  const { name, image, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const { rows } = await pool.query('INSERT INTO homepage_categories (name, image, description) VALUES ($1,$2,$3) RETURNING *', [name, image||'', description||'']);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/homepage/categories/:id', requireSuperAdmin, async (req, res) => {
  const { name, image, description } = req.body;
  try {
    const { rows } = await pool.query('UPDATE homepage_categories SET name=$1, image=$2, description=$3 WHERE id=$4 RETURNING *', [name, image||'', description||'', req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/admin/homepage/categories/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM homepage_categories WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// ─── PUBLIC: HOMEPAGE OPPORTUNITIES ──────────────────────────────────────────
app.get('/api/homepage/opportunities', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM homepage_opportunities ORDER BY featured DESC, id ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/admin/homepage/opportunities', requireSuperAdmin, async (req, res) => {
  const { name, description, image, category, price, featured } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const { rows } = await pool.query('INSERT INTO homepage_opportunities (name, description, image, category, price, featured) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description||'', image||'', category||'', parseFloat(price)||0, !!featured]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/homepage/opportunities/:id', requireSuperAdmin, async (req, res) => {
  const { name, description, image, category, price, featured } = req.body;
  try {
    const { rows } = await pool.query('UPDATE homepage_opportunities SET name=$1, description=$2, image=$3, category=$4, price=$5, featured=$6 WHERE id=$7 RETURNING *',
      [name, description||'', image||'', category||'', parseFloat(price)||0, !!featured, req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/admin/homepage/opportunities/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM homepage_opportunities WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// ─── PUBLIC: TESTIMONIALS ─────────────────────────────────────────────────────
app.get('/api/homepage/testimonials', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM testimonials ORDER BY id ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/admin/homepage/testimonials', requireSuperAdmin, async (req, res) => {
  const { name, role, location, image, text } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'name and text required' });
  try {
    const { rows } = await pool.query('INSERT INTO testimonials (name, role, location, image, text) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, role||'', location||'', image||'', text]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/homepage/testimonials/:id', requireSuperAdmin, async (req, res) => {
  const { name, role, location, image, text } = req.body;
  try {
    const { rows } = await pool.query('UPDATE testimonials SET name=$1, role=$2, location=$3, image=$4, text=$5 WHERE id=$6 RETURNING *',
      [name, role||'', location||'', image||'', text, req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/admin/homepage/testimonials/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// ─── ADMIN: PENDING APPROVALS ────────────────────────────────────────────────
app.get('/api/admin/pending/deposits', requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT d.id, d.amount, d.method, d.reference, d.status, d.deposited_at,
             u.username, u.email, u.phone
      FROM deposits d JOIN users u ON d.user_id = u.id
      WHERE d.status = 'pending_review'
      ORDER BY d.deposited_at DESC
    `);
    res.json({ deposits: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pending deposits' });
  }
});

app.get('/api/admin/pending/withdrawals', requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT w.id, w.amount, w.fee, w.phone, w.method, w.bank_name, w.account_number,
             w.account_name, w.paybill, w.status, w.requested_at,
             u.username, u.email
      FROM withdrawals w JOIN users u ON w.user_id = u.id
      WHERE w.status = 'pending'
      ORDER BY w.requested_at DESC
    `);
    res.json({ withdrawals: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pending withdrawals' });
  }
});

app.post('/api/admin/deposits/:id/approve', requireSuperAdmin, async (req, res) => {
  try {
    const dep = await pool.query('SELECT * FROM deposits WHERE id=$1', [req.params.id]);
    if (!dep.rows.length) return res.status(404).json({ error: 'Deposit not found' });
    const { user_id, amount, status } = dep.rows[0];
    if (status !== 'pending_review') return res.status(400).json({ error: 'Deposit is not pending review' });
    await pool.query('UPDATE deposits SET status=$1 WHERE id=$2', ['confirmed', req.params.id]);
    await pool.query('UPDATE profiles SET wallet_balance = COALESCE(wallet_balance,0) + $1 WHERE user_id = $2', [amount, user_id]);
    res.json({ success: true });
    const u = await pool.query('SELECT username, email FROM users WHERE id=$1', [user_id]);
    if (u.rows.length && u.rows[0].email) {
      sendMail({ to: u.rows[0].email, subject: 'Deposit Confirmed – Balance Updated', html: depositConfirmedEmailHtml(u.rows[0].username, amount) });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
});

app.post('/api/admin/deposits/:id/reject', requireSuperAdmin, async (req, res) => {
  const { reason } = req.body;
  try {
    const dep = await pool.query('SELECT * FROM deposits WHERE id=$1', [req.params.id]);
    if (!dep.rows.length) return res.status(404).json({ error: 'Deposit not found' });
    const { user_id, amount } = dep.rows[0];
    await pool.query('UPDATE deposits SET status=$1 WHERE id=$2', ['rejected', req.params.id]);
    res.json({ success: true });
    const u = await pool.query('SELECT username, email FROM users WHERE id=$1', [user_id]);
    if (u.rows.length && u.rows[0].email) {
      sendMail({ to: u.rows[0].email, subject: 'Deposit Not Approved', html: depositRejectedEmailHtml(u.rows[0].username, amount, reason) });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
});

app.post('/api/admin/withdrawals/:id/approve', requireSuperAdmin, async (req, res) => {
  try {
    const w = await pool.query('SELECT * FROM withdrawals WHERE id=$1', [req.params.id]);
    if (!w.rows.length) return res.status(404).json({ error: 'Withdrawal not found' });
    if (w.rows[0].status !== 'pending') return res.status(400).json({ error: 'Withdrawal is not pending' });
    const { user_id, amount, method } = w.rows[0];
    await pool.query('UPDATE withdrawals SET status=$1, processed_at=NOW() WHERE id=$2', ['completed', req.params.id]);
    res.json({ success: true });
    const u = await pool.query('SELECT username, email FROM users WHERE id=$1', [user_id]);
    if (u.rows.length && u.rows[0].email) {
      sendMail({ to: u.rows[0].email, subject: 'Payment Sent – Withdrawal Successful', html: withdrawalPaidEmailHtml(u.rows[0].username, amount, method || 'mpesa') });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

app.post('/api/admin/withdrawals/:id/reject', requireSuperAdmin, async (req, res) => {
  const { reason } = req.body;
  try {
    const w = await pool.query('SELECT * FROM withdrawals WHERE id=$1', [req.params.id]);
    if (!w.rows.length) return res.status(404).json({ error: 'Withdrawal not found' });
    if (w.rows[0].status !== 'pending') return res.status(400).json({ error: 'Withdrawal is not pending' });
    const { user_id, amount, fee } = w.rows[0];
    const total = parseFloat(amount) + parseFloat(fee || 0);
    await pool.query('UPDATE withdrawals SET status=$1, notes=$2, processed_at=NOW() WHERE id=$3', ['failed', reason || 'Rejected by admin', req.params.id]);
    await pool.query('UPDATE profiles SET account_balance = account_balance + $1 WHERE user_id = $2', [total, user_id]);
    res.json({ success: true });
    const u = await pool.query('SELECT username, email FROM users WHERE id=$1', [user_id]);
    if (u.rows.length && u.rows[0].email) {
      sendMail({ to: u.rows[0].email, subject: 'Withdrawal Rejected', html: withdrawalRejectedEmailHtml(u.rows[0].username, amount, reason) });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

// ─── ADMIN USER MANAGEMENT ───────────────────────────────────────────────────

// List all users with stats
app.get('/api/admin/users', requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.username, u.email, u.phone, u.created_at, u.locked, u.referral_code,
        COALESCE(p.account_balance, 0) AS account_balance,
        COALESCE(p.avatar_url, '') AS avatar_url,
        COALESCE(p.mpesa_phone, '') AS mpesa_phone,
        COALESCE(p.bank_name, '') AS bank_name,
        COALESCE(p.bank_account_number, '') AS bank_account_number,
        COALESCE(p.bank_account_name, '') AS bank_account_name,
        (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.referral_code) AS referral_count,
        (SELECT COALESCE(SUM(i.amount),0) FROM investments i WHERE i.user_id = u.id) AS total_invested,
        (SELECT COALESCE(SUM(d.amount),0) FROM deposits d WHERE d.user_id = u.id AND d.status = 'confirmed') AS total_deposited
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (e) {
    console.error('List users error:', e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Credit or debit a user's account balance
app.put('/api/admin/users/:id/balance', requireSuperAdmin, async (req, res) => {
  const { amount, operation } = req.body; // operation: 'credit' | 'debit'
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid positive amount required' });
  }
  const delta = operation === 'debit' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
  try {
    const result = await pool.query(
      `UPDATE profiles SET account_balance = GREATEST(0, COALESCE(account_balance, 0) + $1), updated_at = NOW()
       WHERE user_id = $2 RETURNING account_balance`,
      [delta, req.params.id]
    );
    if (!result.rows.length) {
      // Profile row may not exist yet — insert it
      await pool.query(
        `INSERT INTO profiles (user_id, account_balance, updated_at) VALUES ($1::uuid, GREATEST(0,$2), NOW())
         ON CONFLICT (user_id) DO UPDATE SET account_balance = GREATEST(0, profiles.account_balance + $2), updated_at = NOW()`,
        [req.params.id, delta]
      );
    }
    const final = await pool.query('SELECT account_balance FROM profiles WHERE user_id=$1', [req.params.id]);
    res.json({ success: true, account_balance: final.rows[0]?.account_balance || 0 });
  } catch (e) {
    console.error('Balance update error:', e);
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Lock or unlock a user
app.put('/api/admin/users/:id/lock', requireSuperAdmin, async (req, res) => {
  const { locked } = req.body;
  try {
    await pool.query('UPDATE users SET locked = $1 WHERE id = $2', [!!locked, req.params.id]);
    res.json({ success: true, locked: !!locked });
  } catch (e) {
    console.error('Lock user error:', e);
    res.status(500).json({ error: 'Failed to update lock status' });
  }
});

// Reset user password
app.put('/api/admin/users/:id/password', requireSuperAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Update locked profile fields for a user (admin only)
app.put('/api/admin/users/:id/profile-fields', requireSuperAdmin, async (req, res) => {
  const { username, mpesa_phone, bank_name, bank_paybill, bank_account_number, bank_account_name } = req.body;
  try {
    const sets = [];
    const vals = [];
    const push = (col, val) => { if (val !== undefined && val !== null) { sets.push(`${col}=$${sets.length+1}`); vals.push(val); } };
    push('mpesa_phone', mpesa_phone || null);
    push('bank_name', bank_name || null);
    push('bank_paybill', bank_paybill || null);
    push('bank_account_number', bank_account_number || null);
    push('bank_account_name', bank_account_name || null);
    if (sets.length) {
      vals.push(req.params.id);
      await pool.query(`UPDATE profiles SET ${sets.join(',')}, updated_at=NOW() WHERE user_id=$${vals.length}`, vals);
    }
    const userSets = [];
    const userVals = [];
    if (username) { userSets.push(`username=$${userSets.length+1}`); userVals.push(username); }
    if (mpesa_phone) { userSets.push(`phone=$${userSets.length+1}`); userVals.push(mpesa_phone); }
    if (userSets.length) {
      userVals.push(req.params.id);
      await pool.query(`UPDATE users SET ${userSets.join(',')} WHERE id=$${userVals.length}`, userVals);
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Profile fields update error:', e);
    res.status(500).json({ error: 'Failed to update profile fields' });
  }
});

// Impersonate a user — generates a valid session token for them
app.post('/api/admin/users/:id/impersonate', requireSuperAdmin, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, username, email, phone, referral_code FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!userResult.rows.length) return res.status(404).json({ error: 'User not found' });
    const user = userResult.rows[0];
    const token = jwt.sign(
      { userId: user.id, impersonated_by: 'admin', jti: crypto.randomBytes(16).toString('hex') },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expires]
    );
    res.json({ token, user });
  } catch (e) {
    console.error('Impersonate error:', e);
    res.status(500).json({ error: 'Failed to create impersonation session' });
  }
});

// Delete a user
app.delete('/api/admin/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM profiles WHERE user_id = $1', [req.params.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete user error:', e);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── WHATSAPP SERVICES ───────────────────────────────────────────────────────

// Public: get all services (groups + managers)
app.get('/api/services/whatsapp', async (req, res) => {
  try {
    const servicesRes = await pool.query('SELECT * FROM whatsapp_services ORDER BY type, created_at ASC');
    // Admin key: return all services without user tier info
    const adminKey = req.headers['x-admin-key'];
    if (adminKey && (adminKey === (process.env.SUPER_ADMIN_KEY || '1540568e'))) {
      return res.json({ services: servicesRes.rows });
    }
    // User JWT: require auth and return tier info
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = auth.slice(7);
    let userId;
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const sess = await pool.query(
        'SELECT u.id FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > NOW()',
        [token]
      );
      if (!sess.rows.length) return res.status(401).json({ error: 'Session expired' });
      userId = sess.rows[0].id;
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const activeL1Res = await pool.query(
      `SELECT COUNT(*) FROM users r
       WHERE r.referred_by = (SELECT referral_code FROM users WHERE id=$1)
         AND EXISTS (SELECT 1 FROM investments i WHERE i.user_id = r.id AND i.status = 'active')`,
      [userId]
    );
    const activeL1 = parseInt(activeL1Res.rows[0].count, 10);
    let membershipLevel = 'Inactive';
    if (activeL1 >= 300)     membershipLevel = 'Gold';
    else if (activeL1 >= 60) membershipLevel = 'Premium';
    else if (activeL1 >= 5)  membershipLevel = 'Basic';
    else if (activeL1 >= 1)  membershipLevel = 'Active';
    res.json({ services: servicesRes.rows, membership_level: membershipLevel, active_referrals: activeL1 });
  } catch (e) {
    console.error('Get services error:', e);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Admin: add service (requires x-admin-key)
app.post('/api/services/whatsapp', requireSuperAdmin, async (req, res) => {
  const { type, name, phone_or_link, category, min_tier } = req.body;
  if (!type || !name || !phone_or_link || !category) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const tier = min_tier || 'all';
  try {
    const result = await pool.query(
      'INSERT INTO whatsapp_services (type, name, phone_or_link, category, min_tier) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [type, name, phone_or_link, category, tier]
    );
    res.json({ service: result.rows[0] });
  } catch (e) {
    console.error('Add service error:', e);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// Admin: update service
app.put('/api/services/whatsapp/:id', requireSuperAdmin, async (req, res) => {
  const { name, phone_or_link, category, min_tier } = req.body;
  const tier = min_tier || 'all';
  try {
    const result = await pool.query(
      'UPDATE whatsapp_services SET name=$1, phone_or_link=$2, category=$3, min_tier=$4 WHERE id=$5 RETURNING *',
      [name, phone_or_link, category, tier, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ service: result.rows[0] });
  } catch (e) {
    console.error('Update service error:', e);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Admin: delete service
app.delete('/api/services/whatsapp/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM whatsapp_services WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete service error:', e);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ── Exchange Code API ────────────────────────────────────────────────────────

// Admin: list all exchange codes with redemption info
app.get('/api/admin/exchange-codes', requireAnyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ec.*,
        COALESCE(json_agg(json_build_object(
          'user_id', er.user_id,
          'amount', er.amount,
          'redeemed_at', er.redeemed_at,
          'username', u.username
        )) FILTER (WHERE er.id IS NOT NULL), '[]') AS redemptions,
        COUNT(er.id) AS redemption_count
      FROM exchange_codes ec
      LEFT JOIN exchange_redemptions er ON er.code_id = ec.id
      LEFT JOIN users u ON u.id = er.user_id
      GROUP BY ec.id
      ORDER BY ec.created_at DESC
    `);
    res.json({ codes: rows });
  } catch (e) {
    console.error('List exchange codes error:', e);
    res.status(500).json({ error: 'Failed to fetch codes' });
  }
});

// Admin: create exchange code(s)
app.post('/api/admin/exchange-codes', requireAnyAdmin, async (req, res) => {
  const { codes } = req.body; // array of code objects
  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({ error: 'No codes provided' });
  }
  try {
    const inserted = [];
    for (const c of codes) {
      const { rows } = await pool.query(
        `INSERT INTO exchange_codes (code, type, code_type, amount, pool_amount, users_count, max_amount, min_amount, expiry, assigned_to)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          c.code, c.type, c.code_type || null,
          c.amount != null ? c.amount : null,
          c.pool_amount != null ? c.pool_amount : null,
          c.users_count != null ? c.users_count : null,
          c.max_amount != null ? c.max_amount : null,
          c.min_amount != null ? c.min_amount : null,
          c.expiry ? new Date(c.expiry) : null,
          c.assigned_to || null
        ]
      );
      inserted.push(rows[0]);
    }
    res.json({ codes: inserted });
  } catch (e) {
    console.error('Create exchange codes error:', e);
    res.status(500).json({ error: 'Failed to create codes' });
  }
});

// Admin: toggle deactivate/activate a code
app.patch('/api/admin/exchange-codes/:id/toggle', requireAnyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE exchange_codes SET deactivated = NOT deactivated WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Code not found' });
    res.json({ code: rows[0] });
  } catch (e) {
    console.error('Toggle exchange code error:', e);
    res.status(500).json({ error: 'Failed to toggle code' });
  }
});

// Admin: delete a code
app.delete('/api/admin/exchange-codes/:id', requireAnyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM exchange_codes WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete exchange code error:', e);
    res.status(500).json({ error: 'Failed to delete code' });
  }
});

// User: redeem an exchange code
app.post('/api/exchange/redeem', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find the code (try with and without RC- prefix)
    const stripped = code.replace(/^RC-(?:USER-|RAND-)?/, '').replace(/^RC-/, '');
    const { rows: codeRows } = await client.query(
      `SELECT * FROM exchange_codes WHERE code=$1 OR code=$2 OR code='RC-'||$3 OR code='RC-USER-'||$3 OR code='RC-RAND-'||$3 FOR UPDATE`,
      [code, 'RC-' + stripped, stripped]
    );
    if (!codeRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invalid code' });
    }
    const ec = codeRows[0];

    if (ec.deactivated) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This code has been deactivated' });
    }
    if (ec.expiry && new Date(ec.expiry) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This code has expired' });
    }

    // Check if this user already redeemed this code
    const { rows: alreadyRedeemed } = await client.query(
      'SELECT id FROM exchange_redemptions WHERE code_id=$1 AND user_id=$2',
      [ec.id, userId]
    );
    if (alreadyRedeemed.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already redeemed this code' });
    }

    let amount;

    if (ec.type === 'random') {
      // Check total users
      const { rows: redemptions } = await client.query(
        'SELECT amount FROM exchange_redemptions WHERE code_id=$1',
        [ec.id]
      );
      if (redemptions.length >= ec.users_count) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This code has reached its maximum number of uses' });
      }
      const usedAmount = redemptions.reduce((s, r) => s + parseFloat(r.amount), 0);
      const remainingPool = parseFloat(ec.pool_amount) - usedAmount;
      const remainingUsers = ec.users_count - redemptions.length;
      if (remainingUsers === 1) {
        amount = remainingPool;
      } else {
        const maxAmt = Math.min(parseFloat(ec.max_amount), remainingPool - parseFloat(ec.min_amount) * (remainingUsers - 1));
        amount = Math.floor(Math.random() * (maxAmt - parseFloat(ec.min_amount) + 1)) + parseFloat(ec.min_amount);
      }
      // Mark as used if all users have redeemed
      if (redemptions.length + 1 >= ec.users_count) {
        await client.query('UPDATE exchange_codes SET used=TRUE WHERE id=$1', [ec.id]);
      }
    } else if (ec.type === 'user') {
      if (ec.assigned_to && ec.assigned_to !== userId && ec.assigned_to !== req.user.username) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This code is assigned to another user' });
      }
      if (ec.used) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This code has already been used' });
      }
      amount = parseFloat(ec.amount);
      await client.query('UPDATE exchange_codes SET used=TRUE WHERE id=$1', [ec.id]);
    } else {
      // single / referral / bulk
      if (ec.used) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This code has already been used' });
      }
      amount = parseFloat(ec.amount);
      await client.query('UPDATE exchange_codes SET used=TRUE WHERE id=$1', [ec.id]);
    }

    // Record redemption
    await client.query(
      'INSERT INTO exchange_redemptions (code_id, user_id, amount) VALUES ($1,$2,$3)',
      [ec.id, userId, amount]
    );

    // Credit user's account_balance (earnings)
    await client.query(
      'UPDATE profiles SET account_balance = account_balance + $1 WHERE user_id=$2',
      [amount, userId]
    );

    await client.query('COMMIT');

    const { rows: balRows } = await pool.query(
      'SELECT account_balance, wallet_balance FROM profiles WHERE user_id=$1',
      [userId]
    );
    const bal = balRows[0] || {};
    res.json({
      success: true,
      amount,
      code_type: ec.type,
      code_sub_type: ec.code_type,
      new_account_balance: parseFloat(bal.account_balance || 0),
      new_wallet_balance: parseFloat(bal.wallet_balance || 0)
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Exchange redeem error:', e);
    res.status(500).json({ error: 'Failed to redeem code' });
  } finally {
    client.release();
  }
});

// User: get exchange redemption history
app.get('/api/exchange/history', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT er.id, er.amount, er.redeemed_at, ec.code, ec.type, ec.code_type
      FROM exchange_redemptions er
      JOIN exchange_codes ec ON ec.id = er.code_id
      WHERE er.user_id=$1
      ORDER BY er.redeemed_at DESC
    `, [req.user.id]);
    res.json({ history: rows });
  } catch (e) {
    console.error('Exchange history error:', e);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─── Clean URL middleware ─────────────────────────────────────────────────────
// 1. Redirect any direct *.html request to the same path without .html
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const clean = req.path.slice(0, -5) || '/';
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, clean + qs);
  }
  next();
});

// 2. For extension-less paths, serve the matching .html file if it exists
app.use((req, res, next) => {
  if (req.path === '/' || extname(req.path) !== '') return next();
  const htmlPath = join(__dirname, req.path + '.html');
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }
  next();
});

app.use(express.static(__dirname));

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
