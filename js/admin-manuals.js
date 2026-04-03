import PDFDocument from 'pdfkit';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const LOGO_PATH = join(ROOT, 'public', 'logo-transparent.png');
const BRAND = { gold: '#d4a017', dark: '#06090f', card: '#0d1520', text: '#333333', lightGray: '#666666', border: '#e0e0e0' };

function addHeader(doc, title) {
  doc.rect(0, 0, doc.page.width, 120).fill(BRAND.dark);
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 40, 20, { width: 70, height: 70 });
  }
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('AfricaBased Technologies', 120, 30, { width: 400 });
  doc.fillColor(BRAND.gold).fontSize(11).font('Helvetica').text('Building Wealth Across Africa', 120, 58);
  doc.fillColor('#ffffff').fontSize(9).text('africabasedtech.com', 120, 78);
  doc.rect(40, 100, doc.page.width - 80, 3).fill(BRAND.gold);
  doc.moveDown(2);
  doc.y = 140;
  doc.fillColor(BRAND.text).fontSize(20).font('Helvetica-Bold').text(title, 40, 140, { align: 'center', width: doc.page.width - 80 });
  doc.moveDown(0.5);
  doc.fillColor(BRAND.lightGray).fontSize(9).font('Helvetica').text('Generated: ' + new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }), 40, doc.y, { align: 'center', width: doc.page.width - 80 });
  doc.moveDown(1.5);
}

function addFooter(doc) {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(BRAND.border).rect(40, doc.page.height - 40, doc.page.width - 80, 0.5).fill();
    doc.fillColor(BRAND.lightGray).fontSize(7).font('Helvetica');
    doc.text('AfricaBased Technologies — Confidential', 40, doc.page.height - 30, { width: 200 });
    doc.text(`Page ${i + 1} of ${pages.count}`, doc.page.width - 140, doc.page.height - 30, { width: 100, align: 'right' });
  }
}

function sectionTitle(doc, text) {
  doc.moveDown(0.8);
  doc.rect(40, doc.y, 4, 16).fill(BRAND.gold);
  doc.fillColor(BRAND.text).fontSize(14).font('Helvetica-Bold').text(text, 52, doc.y + 1);
  doc.moveDown(0.6);
}

function subTitle(doc, text) {
  doc.fillColor(BRAND.gold).fontSize(11).font('Helvetica-Bold').text(text, 48);
  doc.moveDown(0.3);
}

function bodyText(doc, text) {
  doc.fillColor(BRAND.text).fontSize(10).font('Helvetica').text(text, 48, doc.y, { width: doc.page.width - 96, lineGap: 3 });
  doc.moveDown(0.4);
}

function bulletList(doc, items) {
  items.forEach(item => {
    doc.fillColor(BRAND.gold).fontSize(10).font('Helvetica').text('●', 52, doc.y, { continued: true });
    doc.fillColor(BRAND.text).text('  ' + item, { width: doc.page.width - 110, lineGap: 2 });
    doc.moveDown(0.15);
  });
  doc.moveDown(0.3);
}

function tableRow(doc, cols, widths, opts = {}) {
  const startX = 48;
  const y = doc.y;
  const height = 22;
  let x = startX;
  cols.forEach((col, i) => {
    if (opts.header) {
      doc.rect(x, y, widths[i], height).fill('#f0f0f0');
      doc.fillColor(BRAND.text).fontSize(9).font('Helvetica-Bold');
    } else {
      doc.rect(x, y, widths[i], height).fill(opts.alt ? '#fafafa' : '#ffffff').stroke(BRAND.border);
      doc.fillColor(BRAND.text).fontSize(9).font('Helvetica');
    }
    doc.text(col, x + 6, y + 6, { width: widths[i] - 12 });
    x += widths[i];
  });
  doc.y = y + height;
}

function checkPage(doc, needed) {
  if (doc.y + needed > doc.page.height - 60) doc.addPage();
}

export function generateProductManual() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 40, right: 40 }, bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    addHeader(doc, 'Product & Investment Manual');

    sectionTitle(doc, '1. Overview');
    bodyText(doc, 'AfricaBased Technologies offers curated investment products across key African sectors including Agriculture, Technology, Real Estate, Energy, and more. Users invest in product units and earn daily returns over a defined hold period.');

    sectionTitle(doc, '2. How Products Work');
    bodyText(doc, 'Each product on the platform has the following characteristics:');
    bulletList(doc, [
      'Product Name — Identifies the investment opportunity',
      'Sector — The industry category (Agriculture, Tech, Real Estate, etc.)',
      'Price per Unit — The cost to invest in one unit of the product',
      'Daily Returns — The amount earned per day per unit',
      'Hold Period — The number of days the investment runs',
      'Total Expected Return — Daily returns × hold period',
      'ROI — The percentage return on the invested amount',
      'Total Units — The maximum number of units available',
      'Max Units per User — Limits how many units one user can buy',
      'Investor Limit — Maximum number of unique investors allowed',
    ]);

    sectionTitle(doc, '3. Investing in a Product');
    bodyText(doc, 'Step-by-step process for users:');
    bulletList(doc, [
      '1. Browse available products on the Invest page',
      '2. Select a product and choose the number of units',
      '3. Choose balance source: Deposit Balance (wallet) or Earnings Balance (income)',
      '4. Confirm the investment — funds are deducted immediately',
      '5. Investment becomes "Active" and appears on the My Products page',
      '6. User can collect daily returns every 24 hours (weekdays only)',
    ]);

    checkPage(doc, 200);
    sectionTitle(doc, '4. Collection Rules');
    bodyText(doc, 'Daily income collection follows these rules:');
    bulletList(doc, [
      'Collections are available every 24 hours after the last collection',
      'No collections on weekends (Saturday & Sunday) — maintenance days',
      'The first collection is available 24 hours after the investment starts',
      'Each collection adds the daily return amount to the user\'s Earnings Balance',
      'Collections are logged with timestamps for full transparency',
    ]);

    checkPage(doc, 180);
    sectionTitle(doc, '5. Investment Maturity');
    bodyText(doc, 'An investment matures (completes) only when the full expected return amount has been collected. This is NOT based on calendar dates — even if the hold period passes, the investment stays active until all returns are collected.');
    bulletList(doc, [
      'Expected Total = Daily Returns × Hold Period (in days)',
      'Status changes to "COMPLETED" only when Total Collected ≥ Expected Total',
      'Progress bar shows percentage of expected total collected',
      'Missed collection days do NOT reduce total returns — they simply extend the duration',
      'Once matured, the product unit becomes available for reinvestment if applicable',
    ]);

    checkPage(doc, 180);
    sectionTitle(doc, '6. Balance Types');
    bodyText(doc, 'The platform uses two distinct balance types:');
    
    subTitle(doc, 'Deposit Balance (Wallet Balance)');
    bulletList(doc, [
      'Funded by user deposits (M-Pesa, bank transfer, etc.)',
      'Can be used to invest in products',
      'Cannot be withdrawn directly',
    ]);

    subTitle(doc, 'Earnings Balance (Account Balance)');
    bulletList(doc, [
      'Funded by daily income collections and referral commissions',
      'Can be used to invest in products',
      'Can be withdrawn via M-Pesa or bank transfer',
      'Withdrawal fees may apply',
    ]);

    checkPage(doc, 160);
    sectionTitle(doc, '7. Frequently Asked Questions');
    bodyText(doc, 'Common questions about products and investments:');
    bulletList(doc, [
      'Can I invest using my Earnings Balance? — Yes, you can use either Deposit or Earnings Balance.',
      'What happens if I miss a collection day? — Your returns are not lost. The investment simply extends until all returns are collected.',
      'Can I cancel an investment? — No, once invested the funds are locked until maturity.',
      'What happens after maturity? — The investment is marked as completed and you can reinvest.',
      'How do I see my active investments? — Go to the Holdings page from the bottom navigation.',
    ]);

    addFooter(doc);
    doc.end();
  });
}

export function generateCommissionManual() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 40, right: 40 }, bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    addHeader(doc, 'Referral & Commission Manual');

    sectionTitle(doc, '1. Referral System Overview');
    bodyText(doc, 'AfricaBased operates a 3-level referral system that rewards users for building a network of active investors. Users share their unique referral code or link, and earn commissions based on their downline\'s investment activity.');

    sectionTitle(doc, '2. Commission Structure');
    bodyText(doc, 'Commissions are calculated as a percentage of daily returns earned by downline users:');
    doc.moveDown(0.3);
    
    checkPage(doc, 100);
    const tw = [160, 160, 160];
    tableRow(doc, ['Referral Level', 'Relationship', 'Commission Rate'], tw, { header: true });
    tableRow(doc, ['Level 1', 'Direct referrals (your invitees)', '10%'], tw, { alt: false });
    tableRow(doc, ['Level 2', 'Referrals of your referrals', '6%'], tw, { alt: true });
    tableRow(doc, ['Level 3', 'Third-degree connections', '1%'], tw, { alt: false });
    doc.moveDown(0.5);

    bodyText(doc, 'Example: If your Level 1 referral earns KSH 100/day from investments, you earn KSH 10/day commission from them. If their referral (your Level 2) earns KSH 200/day, you earn KSH 12/day from that person.');

    checkPage(doc, 200);
    sectionTitle(doc, '3. Membership Tiers');
    bodyText(doc, 'Users progress through membership tiers based on their total number of active downlines (across all levels). Each tier unlocks additional benefits:');
    doc.moveDown(0.3);

    const mw = [120, 150, 210];
    tableRow(doc, ['Tier', 'Requirement', 'Benefits'], mw, { header: true });
    tableRow(doc, ['Active', '1+ active downline', 'Basic platform access'], mw, { alt: false });
    tableRow(doc, ['Basic', '5+ active downlines', 'Commission earnings unlocked!'], mw, { alt: true });
    tableRow(doc, ['Premium', '60+ active downlines', 'Enhanced earning potential'], mw, { alt: false });
    tableRow(doc, ['Gold', '300+ active downlines', 'Maximum earning tier'], mw, { alt: true });
    doc.moveDown(0.5);

    bodyText(doc, 'IMPORTANT: Users must reach Basic tier (5+ active direct referrals with active investments) before they can start collecting commissions.');

    checkPage(doc, 200);
    sectionTitle(doc, '4. Commission Collection');
    bodyText(doc, 'How users collect their earned commissions:');
    bulletList(doc, [
      'Go to the Referrals page and tap "Collect Commission"',
      'Commissions can be collected once every 24 hours',
      'No collections on weekends (Saturday & Sunday)',
      'Collected commissions go directly to Earnings Balance',
      'Commission amount depends on downline\'s daily earnings that day',
      'If downlines have no active investments, commission will be zero',
    ]);

    checkPage(doc, 180);
    sectionTitle(doc, '5. Referral Code & Sharing');
    bodyText(doc, 'Each user receives a unique referral code upon registration. They can share it via:');
    bulletList(doc, [
      'Direct link — Contains their referral code as a URL parameter',
      'Copy code — Referral code displayed on the Referrals page',
      'Social sharing — Share buttons for WhatsApp, Twitter, Facebook',
      'When a new user signs up with a referral code, they appear as a Level 1 downline',
    ]);

    checkPage(doc, 180);
    sectionTitle(doc, '6. Active vs. Inactive Referrals');
    bodyText(doc, 'A referral is considered "active" only if they have at least one active (ongoing) investment. Users with no active investments do not generate commissions and do not count toward tier requirements.');

    sectionTitle(doc, '7. Tips for Growing Your Network');
    bodyText(doc, 'Strategies for maximizing your referral earnings:');
    bulletList(doc, [
      'Share your referral link on social media and WhatsApp groups',
      'Help your referrals make their first investment to activate commissions',
      'Encourage your Level 1 referrals to also invite others — you earn from 3 levels deep',
      'Focus on reaching Basic tier (5 active referrals) to start earning commissions',
      'Track your referral progress on the Referrals page',
    ]);

    addFooter(doc);
    doc.end();
  });
}

export function generatePlatformGuide() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 40, right: 40 }, bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    addHeader(doc, 'Platform User Guide');

    sectionTitle(doc, '1. User Registration & Authentication');
    bodyText(doc, 'New users register through the signup page:');
    bulletList(doc, [
      'Enter username, email, and password',
      'Receive a 6-digit OTP via email for verification',
      'OTP can be entered manually or by clicking the email link',
      'Registration works from any device — no need to verify on the same browser',
      'After verification, users are prompted to add their phone number',
      'Optional: Enable biometric login (fingerprint/Face ID) from Profile',
    ]);

    sectionTitle(doc, '2. Deposit Methods');
    bodyText(doc, 'Users can fund their accounts through:');
    bulletList(doc, [
      'M-Pesa STK Push — Automatic prompt sent to user\'s phone',
      'Manual M-Pesa — User sends money to provided paybill/till number',
      'Bank Transfer — User transfers to company bank account',
      'Deposits go to the Wallet Balance (not directly withdrawable)',
      'Admin must approve manual deposits before balance is credited',
    ]);

    checkPage(doc, 200);
    sectionTitle(doc, '3. Withdrawal Process');
    bodyText(doc, 'Users can withdraw from their Earnings Balance:');
    bulletList(doc, [
      'Minimum and maximum withdrawal limits may apply',
      'M-Pesa withdrawal — funds sent directly to user\'s phone',
      'Bank withdrawal — funds sent to user\'s registered bank account',
      'Processing fees may apply based on withdrawal method',
      'Admin can approve or reject withdrawal requests',
      'Only Earnings Balance is withdrawable — Deposit Balance cannot be withdrawn',
    ]);

    checkPage(doc, 200);
    sectionTitle(doc, '4. Exchange Codes');
    bodyText(doc, 'Exchange codes are promotional or reward codes that add funds to your account:');
    bulletList(doc, [
      'Go to the Exchange page from the bottom navigation or quick actions',
      'Enter the code you received and tap "Redeem"',
      'The code value is added to your Earnings Balance',
      'Each code can only be used once',
      'Some codes may have an expiry date',
    ]);

    checkPage(doc, 180);
    sectionTitle(doc, '5. Account Security');
    bodyText(doc, 'Keep your account safe with these security features:');
    bulletList(doc, [
      'Use a strong, unique password for your account',
      'Enable biometric login (fingerprint/Face ID) from your Profile page',
      'Never share your login credentials or referral earnings with others',
      'Your session automatically expires after inactivity for security',
      'If you forget your password, use the "Forgot Password" link on the login page',
    ]);

    checkPage(doc, 160);
    sectionTitle(doc, '6. Email Notifications');
    bodyText(doc, 'You will receive email notifications for important account activity:');
    bulletList(doc, [
      'Registration verification code',
      'Welcome email after successful sign-up',
      'Password reset links',
      'Deposit confirmation or rejection',
      'Withdrawal processing status updates',
    ]);

    addFooter(doc);
    doc.end();
  });
}

export function generateDepositWithdrawalManual() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 40, right: 40 }, bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    addHeader(doc, 'Deposit & Withdrawal Manual');

    sectionTitle(doc, '1. Deposit Overview');
    bodyText(doc, 'Deposits add funds to the user\'s Wallet Balance. The platform supports both automatic (STK Push) and manual deposit methods.');

    sectionTitle(doc, '2. Automatic Deposit (M-Pesa STK Push)');
    bodyText(doc, 'When configured, users can deposit via STK Push:');
    bulletList(doc, [
      'User enters amount and taps "Deposit"',
      'An M-Pesa payment prompt is sent to their phone',
      'User enters their M-Pesa PIN to confirm',
      'On successful payment, the deposit is recorded automatically',
      'Balance is credited after admin approval (or instantly if auto-approve is enabled)',
    ]);

    checkPage(doc, 200);
    sectionTitle(doc, '3. Manual Deposit');
    bodyText(doc, 'When manual mode is enabled, users follow step-by-step instructions:');
    bulletList(doc, [
      'User selects deposit amount',
      'Platform displays payment channel details (M-Pesa number, Till, Paybill, or Bank)',
      'User sends the exact amount to the displayed number/account',
      'User enters the transaction code (e.g., M-Pesa confirmation code)',
      'Deposit enters "Pending Review" status',
      'Admin reviews and approves/rejects the deposit from the Approvals panel',
    ]);

    checkPage(doc, 200);
    sectionTitle(doc, '4. Payment Methods');
    bodyText(doc, 'The platform supports multiple payment methods for deposits:');
    bulletList(doc, [
      'M-Pesa — Send directly to the provided M-Pesa number',
      'Till Number — Pay via Lipa na M-Pesa buy goods',
      'Paybill — Send to the paybill number with your account details',
      'Bank Transfer — Transfer to the company bank account',
      'Follow the on-screen instructions carefully for each method',
      'Always enter the correct transaction code after sending money',
    ]);

    checkPage(doc, 200);
    sectionTitle(doc, '5. Withdrawal Process');
    bodyText(doc, 'How to withdraw your earnings:');
    bulletList(doc, [
      'Only your Earnings Balance can be withdrawn — Deposit Balance is for investing only',
      'Go to the Withdraw page from the quick actions or bottom navigation',
      'Select your withdrawal method: M-Pesa or Bank Transfer',
      'Enter the amount you wish to withdraw',
      'Processing fees will be shown before you confirm',
      'Your request is submitted for processing',
      'You will receive an email notification once processed',
      'If rejected, the amount is returned to your Earnings Balance',
    ]);

    checkPage(doc, 200);
    sectionTitle(doc, '6. Deposit & Withdrawal Tips');
    bodyText(doc, 'Important things to keep in mind:');
    bulletList(doc, [
      'Always double-check the payment details before sending money',
      'Save your M-Pesa transaction code — you will need it to confirm the deposit',
      'Deposits may take some time to be confirmed depending on processing mode',
      'Ensure your phone number and bank details are up to date in your Profile',
      'Contact support if your deposit or withdrawal is delayed beyond 24 hours',
    ]);

    addFooter(doc);
    doc.end();
  });
}

export const MANUAL_CATALOG = [
  { id: 'product', name: 'Product & Investment Manual', filename: 'AfricaBased_Product_Manual.pdf', generator: generateProductManual, icon: 'fa-box', color: '#d4a017' },
  { id: 'commission', name: 'Referral & Commission Manual', filename: 'AfricaBased_Commission_Manual.pdf', generator: generateCommissionManual, icon: 'fa-network-wired', color: '#4CAF50' },
  { id: 'deposit-withdrawal', name: 'Deposit & Withdrawal Manual', filename: 'AfricaBased_Deposit_Withdrawal_Manual.pdf', generator: generateDepositWithdrawalManual, icon: 'fa-money-bill-wave', color: '#2196F3' },
  { id: 'platform', name: 'Platform User Guide', filename: 'AfricaBased_Platform_Guide.pdf', generator: generatePlatformGuide, icon: 'fa-cogs', color: '#9C27B0' },
];
