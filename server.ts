import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database Setup
let db: any;

function initDB() {
  db = new Database('./database.sqlite');

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      amount REAL,
      status TEXT,
      gateway TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      payment_date DATETIME,
      affiliate_code TEXT,
      commission_amount REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      password_hash TEXT,
      role TEXT,
      status TEXT DEFAULT 'ACTIVE'
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT, -- 'main' or 'upsell'
      name TEXT,
      price REAL,
      regular_price REAL,
      image_url TEXT,
      file_url TEXT,
      description TEXT,
      status TEXT DEFAULT 'ACTIVE'
    );
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      type TEXT, -- 'fixed' or 'percent'
      amount REAL,
      expiry_date DATETIME,
      usage_limit INTEGER DEFAULT -1,
      usage_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE'
    );
    -- Affiliate Tables
    CREATE TABLE IF NOT EXISTS affiliates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      code TEXT UNIQUE,
      balance REAL DEFAULT 0,
      total_earnings REAL DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      affiliate_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS affiliate_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      affiliate_id INTEGER,
      amount REAL,
      type TEXT, -- 'COMMISSION', 'WITHDRAWAL'
      source_order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      affiliate_id INTEGER,
      amount REAL,
      method TEXT,
      details TEXT,
      status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS automation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      name TEXT,
      phone TEXT,
      action_type TEXT, -- 'SMS', 'EMAIL'
      message TEXT,
      status TEXT DEFAULT 'SENT', -- 'SENT', 'FAILED'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    db.exec(`
      INSERT INTO settings (setting_key, setting_value) VALUES 
      ('social_proof_enabled', '1'),
      ('social_proof_dummy_enabled', '0'),
      ('social_proof_templates', '["{name} from {location} purchased just now", "{name} just ordered from {location}", "New order from {name}, {location}"]'),
      ('social_proof_delay', '5'),
      ('social_proof_duration', '5'),
      ('coupon_timer_enabled', '1'),
      ('coupon_timer_duration', '60'),
      ('affiliate_commission_percent', '20'),
      ('affiliate_notification_sms', 'Congrats! You earned ৳{commission} from a new sale. Total: ৳{total_earnings}.'),
      ('affiliate_notification_email_subject', 'New Affiliate Sale: You earned ৳{commission}'),
      ('affiliate_notification_email_body', 'Hi {name},<br>Good news! A new sale of ৳{order_amount} was made using your link.<br>You earned: ৳{commission}<br>Total Earnings: ৳{total_earnings}<br><br>Keep it up!'),
      ('smtp_host', ''),
      ('smtp_port', '587'),
      ('smtp_user', ''),
      ('smtp_pass', ''),
      ('smtp_secure', '0'),
      ('sender_email', 'noreply@example.com'),
      ('sender_name', 'My Store')
    `);
  }

  // Migration: Add gateway column if missing
  try {
    db.prepare("SELECT gateway FROM orders LIMIT 1").get();
  } catch (e) {
    db.prepare("ALTER TABLE orders ADD COLUMN gateway TEXT").run();
  }
  
  // Migration: Add regular_price to products if missing
  try {
    db.prepare("SELECT regular_price FROM products LIMIT 1").get();
  } catch (e) {
    try { db.prepare("ALTER TABLE products ADD COLUMN regular_price REAL").run(); } catch(err) {}
  }
  
  // Migration: Add affiliate columns to orders if missing
  try {
    db.prepare("SELECT affiliate_code FROM orders LIMIT 1").get();
  } catch (e) {
    try { db.prepare("ALTER TABLE orders ADD COLUMN affiliate_code TEXT").run(); } catch(err) {}
    try { db.prepare("ALTER TABLE orders ADD COLUMN commission_amount REAL DEFAULT 0").run(); } catch(err) {}
  }

  // Migration: Add affiliate_commission_percent if missing
  const hasAffiliateSetting = db.prepare("SELECT 1 FROM settings WHERE setting_key = 'affiliate_commission_percent'").get();
  if (!hasAffiliateSetting) {
    db.prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('affiliate_commission_percent', '20')").run();
  }

  // Migration: Add affiliate notification settings if missing
  const hasAffiliateNotif = db.prepare("SELECT 1 FROM settings WHERE setting_key = 'affiliate_notification_sms'").get();
  if (!hasAffiliateNotif) {
      const stmt = db.prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
      stmt.run('affiliate_notification_sms', 'Congrats! You earned ৳{commission} from a new sale. Total: ৳{total_earnings}.');
      stmt.run('affiliate_notification_email_subject', 'New Affiliate Sale: You earned ৳{commission}');
      stmt.run('affiliate_notification_email_body', 'Hi {name},<br>Good news! A new sale of ৳{order_amount} was made using your link.<br>You earned: ৳{commission}<br>Total Earnings: ৳{total_earnings}<br><br>Keep it up!');
  }

  // Migration: Add SMTP settings if missing
  const hasSmtp = db.prepare("SELECT 1 FROM settings WHERE setting_key = 'smtp_host'").get();
  if (!hasSmtp) {
      const stmt = db.prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
      stmt.run('smtp_host', 'mail.shehzin.com');
      stmt.run('smtp_port', '465');
      stmt.run('smtp_user', 'ebook@shehzin.com');
      stmt.run('smtp_pass', 'eBook73269@');
      stmt.run('smtp_secure', '1');
      stmt.run('sender_email', 'ebook@shehzin.com');
      stmt.run('sender_name', 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট');
  }

  // Migration: Add SMS settings if missing
  const hasSms = db.prepare("SELECT 1 FROM settings WHERE setting_key = 'sms_api_key'").get();
  if (!hasSms) {
      const stmt = db.prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
      stmt.run('sms_api_key', '');
      stmt.run('sms_sender_id', '');
  }

  // Remove dummy orders if they exist (cleanup)
  db.prepare(`DELETE FROM orders WHERE email IN ('rahim@example.com', 'karim@example.com', 'suma@example.com', 'jamal@example.com')`).run();
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const settings = db.prepare("SELECT * FROM settings WHERE setting_key LIKE 'smtp_%' OR setting_key LIKE 'sender_%'").all();
    const config: any = {};
    settings.forEach((s: any) => config[s.setting_key] = s.setting_value);

    // Fallback to Hardcoded Defaults if DB is empty (for Dev Environment)
    if (!config.smtp_host) config.smtp_host = 'mail.shehzin.com';
    if (!config.smtp_user) config.smtp_user = 'ebook@shehzin.com';
    if (!config.smtp_pass) config.smtp_pass = 'eBook73269@';
    if (!config.smtp_port) config.smtp_port = '465';
    if (!config.smtp_secure) config.smtp_secure = '1';
    if (!config.sender_email) config.sender_email = 'ebook@shehzin.com';
    if (!config.sender_name) config.sender_name = 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট';

    if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
      console.log('SMTP not configured. Email skipped:', to);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: parseInt(config.smtp_port || '587'),
      secure: config.smtp_secure === '1', // true for 465, false for other ports
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${config.sender_name}" <${config.sender_email}>`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

async function sendSMS(to: string, message: string) {
  if (!to || to === 'N/A' || to.length < 10) return false;
  try {
    const apiKey = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'sms_api_key'").get()?.setting_value;
    const senderId = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'sms_sender_id'").get()?.setting_value;

    if (!apiKey || !senderId) {
      console.log('SMS not configured. SMS skipped:', to);
      return false;
    }

    // BulkSMSBD API URL
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${to}&senderid=${senderId}&message=${encodeURIComponent(message)}`;

    const response = await fetch(url);
    const data: any = await response.json();

    if (data.response_code === 202 || data.success === true) {
        console.log("SMS sent successfully:", data);
        return true;
    } else {
        console.error("Error sending SMS:", data);
        return false;
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

// Cron Job for Automation (Runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Running Automation Cron Job...');
  try {
    // Fetch pending orders created X hours ago based on settings
    const keys = ['automation_day1', 'automation_day3', 'automation_day5', 'automation_paid_level1', 'automation_paid_level2', 'automation_paid_level3'];
    const settings = db.prepare(`SELECT * FROM settings WHERE setting_key IN (${keys.map(() => '?').join(',')})`).all(...keys);
    
    const config: any = {};
    settings.forEach((s: any) => {
        try {
            config[s.setting_key.replace('automation_', '')] = JSON.parse(s.setting_value);
        } catch (e) {
            config[s.setting_key.replace('automation_', '')] = {};
        }
    });

    const processAutomation = async (step: string, status: string, delayHours: number, smsTemplate: string, emailSubject: string, emailBody: string) => {
        if (!delayHours || delayHours <= 0) return;
        
        // Calculate the time window (e.g., created between delayHours and delayHours + 1 hour ago)
        // Actually, let's just check if created_at < NOW - delayHours AND not already sent for this step
        
        // We need a way to track which step has been sent to which order.
        // For simplicity, we can check automation_logs for a specific message pattern or add a column to orders (complex migration).
        // Better: Check automation_logs for action_type = 'AUTOMATION_' + step + '_' + orderId
        
        // Let's fetch orders that match the criteria
        const timeThreshold = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();
        // const endTimeThreshold = new Date(Date.now() - (delayHours + 1) * 60 * 60 * 1000).toISOString(); // Optional window
        
        const orders = db.prepare(`SELECT * FROM orders WHERE status = ? AND created_at <= ? AND created_at > datetime(?, '-2 days')`).all(status, timeThreshold, timeThreshold); // Optimization: limit lookback
        
        for (const order of orders) {
            // Check if already sent
            const logExists = db.prepare("SELECT 1 FROM automation_logs WHERE order_id = ? AND action_type = ?").get(order.id, `AUTOMATION_${step}`);
            if (logExists) continue;

            // Send Message
            let sent = false;
            if (smsTemplate) {
                const msg = smsTemplate.replace(/{name}/g, order.name);
                const smsSent = await sendSMS(order.phone, msg);
                db.prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?, ?)").run(order.id, order.name, order.phone, `AUTOMATION_${step}_SMS`, msg, smsSent ? 'SENT' : 'FAILED');
                sent = true;
            }
            
            if (emailSubject && emailBody) {
                const subject = emailSubject.replace(/{name}/g, order.name);
                const body = emailBody.replace(/{name}/g, order.name);
                const emailSent = await sendEmail(order.email, subject, body);
                db.prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?, ?)").run(order.id, order.name, order.phone, `AUTOMATION_${step}_EMAIL`, `Subject: ${subject}`, emailSent ? 'SENT' : 'FAILED');
                sent = true;
            }
            
            if (sent) {
                // Mark as processed for this step to avoid duplicate sending
                // We use the log entry itself as the marker
                console.log(`Processed ${step} for Order #${order.id}`);
            }
        }
    };

    // Pending Orders
    await processAutomation('day1', 'PENDING', parseInt(config.day1?.delay || '0'), config.day1?.sms, config.day1?.email_subject, config.day1?.email_body);
    await processAutomation('day3', 'PENDING', parseInt(config.day3?.delay || '0'), config.day3?.sms, config.day3?.email_subject, config.day3?.email_body);
    await processAutomation('day5', 'PENDING', parseInt(config.day5?.delay || '0'), config.day5?.sms, config.day5?.email_subject, config.day5?.email_body);

    // Paid Orders
    await processAutomation('paid_level1', 'PAID', parseInt(config.paid_level1?.delay || '0'), config.paid_level1?.sms, config.paid_level1?.email_subject, config.paid_level1?.email_body);
    await processAutomation('paid_level2', 'PAID', parseInt(config.paid_level2?.delay || '0'), config.paid_level2?.sms, config.paid_level2?.email_subject, config.paid_level2?.email_body);
    await processAutomation('paid_level3', 'PAID', parseInt(config.paid_level3?.delay || '0'), config.paid_level3?.sms, config.paid_level3?.email_subject, config.paid_level3?.email_body);

  } catch (e) {
    console.error('Automation Cron Error:', e);
  }
});

async function startServer() {
  initDB();
  const app = express();
  const PORT = 3000;

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // --- API Routes ---

  // User Login
  app.post('/api/login.php', async (req, res) => {
      try {
          const { identifier, password } = req.body;
          // Default password check
          if (password !== '12345678') {
              return res.json({ status: 'error', message: 'Invalid password' });
          }

          // Check if user exists in orders (PAID)
          const user = db.prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PAID'").get(identifier, identifier);
          
          if (!user) {
              return res.json({ status: 'error', message: 'No paid account found with this email/phone.' });
          }

          // Check if user is an affiliate
          const affiliate = db.prepare("SELECT * FROM affiliates WHERE email = ?").get(user.email);

          res.json({
              status: 'success',
              token: 'mock-token-' + user.id,
              user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  is_affiliate: !!affiliate,
                  affiliate_code: affiliate?.code || null
              }
          });
      } catch (e: any) {
          res.status(500).json({ status: 'error', message: e.message });
      }
  });

  // Affiliate: Join
  app.post('/api/affiliate/join.php', async (req, res) => {
      try {
          const { email } = req.body;
          
          // Check if already affiliate
          const existing = db.prepare("SELECT * FROM affiliates WHERE email = ?").get(email);
          if (existing) {
              return res.json({ status: 'success', message: 'Already an affiliate', code: existing.code });
          }

          // Generate Code (Name based or Random)
          // Simple logic: First 4 chars of email + random number
          const namePart = email.split('@')[0].substring(0, 4).toUpperCase();
          const randomPart = Math.floor(1000 + Math.random() * 9000);
          const code = `${namePart}${randomPart}`;

          db.prepare("INSERT INTO affiliates (email, code) VALUES (?, ?)").run(email, code);
          
          res.json({ status: 'success', message: 'Affiliate account created', code });
      } catch (e: any) {
          res.status(500).json({ status: 'error', message: e.message });
      }
  });

  // Affiliate: Get Stats
  app.get('/api/affiliate/stats.php', async (req, res) => {
      try {
          const email = req.query.email as string;
          if (!email) return res.json({ status: 'error', message: 'Email required' });

          const affiliate = db.prepare("SELECT * FROM affiliates WHERE email = ?").get(email);
          if (!affiliate) return res.json({ status: 'error', message: 'Affiliate not found' });

          const clicks = db.prepare("SELECT COUNT(*) as count FROM affiliate_clicks WHERE affiliate_id = ?").get(affiliate.id).count;
          const sales = db.prepare("SELECT COUNT(*) as count FROM affiliate_transactions WHERE affiliate_id = ? AND type = 'COMMISSION'").get(affiliate.id).count;
          
          // Get recent transactions
          const transactions = db.prepare("SELECT * FROM affiliate_transactions WHERE affiliate_id = ? ORDER BY created_at DESC LIMIT 20").all(affiliate.id);
          
          // Get withdrawals
          const withdrawals = db.prepare("SELECT * FROM affiliate_withdrawals WHERE affiliate_id = ? ORDER BY created_at DESC").all(affiliate.id);

          // Get Commission Rate
          const rate = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_commission_percent'").get()?.setting_value || '20';

          res.json({
              status: 'success',
              data: {
                  ...affiliate,
                  clicks,
                  sales,
                  commission_rate: rate,
                  transactions,
                  withdrawals
              }
          });
      } catch (e: any) {
          res.status(500).json({ status: 'error', message: e.message });
      }
  });

  // Affiliate: Track Click
  app.post('/api/affiliate/track_click.php', async (req, res) => {
      try {
          const { code, ip } = req.body;
          const affiliate = db.prepare("SELECT id FROM affiliates WHERE code = ?").get(code);
          
          if (affiliate) {
              // Prevent duplicate clicks from same IP within 24 hours (optional, simple version here)
              db.prepare("INSERT INTO affiliate_clicks (affiliate_id, ip_address) VALUES (?, ?)").run(affiliate.id, ip || 'unknown');
          }
          res.json({ status: 'success' });
      } catch (e) {
          res.json({ status: 'error' }); // Fail silently
      }
  });

  // Affiliate: Request Withdrawal
  app.post('/api/affiliate/withdraw.php', async (req, res) => {
      try {
          const { email, amount, method, details } = req.body;
          
          const affiliate = db.prepare("SELECT * FROM affiliates WHERE email = ?").get(email);
          if (!affiliate) return res.json({ status: 'error', message: 'Affiliate not found' });

          if (affiliate.balance < amount) {
              return res.json({ status: 'error', message: 'Insufficient balance' });
          }
          
          if (amount < 500) { // Min withdrawal
              return res.json({ status: 'error', message: 'Minimum withdrawal is 500 BDT' });
          }

          // Deduct Balance immediately (or lock it). Let's deduct and create pending transaction.
          // Better: Create pending withdrawal, deduct balance. If rejected, refund.
          
          const transaction = db.transaction(() => {
              db.prepare("UPDATE affiliates SET balance = balance - ? WHERE id = ?").run(amount, affiliate.id);
              db.prepare("INSERT INTO affiliate_withdrawals (affiliate_id, amount, method, details) VALUES (?, ?, ?, ?)").run(affiliate.id, amount, method, details);
              db.prepare("INSERT INTO affiliate_transactions (affiliate_id, amount, type, created_at) VALUES (?, ?, 'WITHDRAWAL', CURRENT_TIMESTAMP)").run(affiliate.id, -amount);
          });
          
          transaction();

          res.json({ status: 'success', message: 'Withdrawal request submitted' });
      } catch (e: any) {
          res.status(500).json({ status: 'error', message: e.message });
      }
  });

  // Admin: Affiliate Management
  app.all('/api/admin/affiliates.php', async (req, res) => {
      const action = req.query.action;
      
      if (action === 'get_stats') {
          const affiliates = db.prepare(`
              SELECT a.*, 
              (SELECT COUNT(*) FROM affiliate_clicks c WHERE c.affiliate_id = a.id) as clicks,
              (SELECT COUNT(*) FROM affiliate_transactions t WHERE t.affiliate_id = a.id AND t.type = 'COMMISSION') as sales
              FROM affiliates a
          `).all();
          
          const withdrawals = db.prepare(`
              SELECT w.*, a.email, a.code 
              FROM affiliate_withdrawals w 
              JOIN affiliates a ON w.affiliate_id = a.id 
              ORDER BY w.created_at DESC
          `).all();

          const settings = {
              commission_percent: db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_commission_percent'").get()?.setting_value || '20',
              notification_sms: db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_sms'").get()?.setting_value || '',
              notification_email_subject: db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_email_subject'").get()?.setting_value || '',
              notification_email_body: db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_email_body'").get()?.setting_value || ''
          };

          res.json({ affiliates, withdrawals, settings });
      }
      
      else if (action === 'get_settings') {
          const settings = {
              commission_percent: db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_commission_percent'").get()?.setting_value || '20',
              notification_sms: db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_sms'").get()?.setting_value || '',
              notification_email_subject: db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_email_subject'").get()?.setting_value || '',
              notification_email_body: db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_email_body'").get()?.setting_value || ''
          };
          res.json(settings);
      }
      
      else if (action === 'update_withdrawal') {
          const { id, status } = req.body; // status: 'APPROVED' or 'REJECTED'
          
          const withdrawal = db.prepare("SELECT * FROM affiliate_withdrawals WHERE id = ?").get(id);
          if (!withdrawal) return res.json({ status: 'error', message: 'Not found' });

          if (status === 'REJECTED' && withdrawal.status === 'PENDING') {
              // Refund balance
              const transaction = db.transaction(() => {
                  db.prepare("UPDATE affiliate_withdrawals SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
                  db.prepare("UPDATE affiliates SET balance = balance + ? WHERE id = ?").run(withdrawal.amount, withdrawal.affiliate_id);
                  db.prepare("INSERT INTO affiliate_transactions (affiliate_id, amount, type, created_at) VALUES (?, ?, 'REFUND', CURRENT_TIMESTAMP)").run(withdrawal.affiliate_id, withdrawal.amount);
              });
              transaction();
          } else if (status === 'APPROVED') {
              db.prepare("UPDATE affiliate_withdrawals SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
          }
          
          res.json({ status: 'success' });
      }

      else if (action === 'update_settings') {
          const { commission_percent, notification_sms, notification_email_subject, notification_email_body } = req.body;
          
          const updateStmt = db.prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?");
          const insertStmt = db.prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
          const checkStmt = db.prepare("SELECT 1 FROM settings WHERE setting_key = ?");

          const saveSetting = (key: string, val: string) => {
              if (checkStmt.get(key)) updateStmt.run(val, key);
              else insertStmt.run(key, val);
          };

          saveSetting('affiliate_commission_percent', commission_percent);
          saveSetting('affiliate_notification_sms', notification_sms);
          saveSetting('affiliate_notification_email_subject', notification_email_subject);
          saveSetting('affiliate_notification_email_body', notification_email_body);

          res.json({ status: 'success' });
      }
      
      else {
          res.json({ status: 'error', message: 'Invalid action' });
      }
  });

  app.get('/api/setup_auth.php', (req, res) => {
    try {
        // Fix Database Schema
        initDB();
        
        // Ensure settings exist
        const defaultSettings = [
            ['affiliate_commission_percent', '20'],
            ['affiliate_notification_sms', 'Congrats! You earned ৳{commission} from a new sale. Total: ৳{total_earnings}.'],
            ['affiliate_notification_email_subject', 'New Affiliate Sale: You earned ৳{commission}'],
            ['affiliate_notification_email_body', 'Hi {name},<br>Good news! A new sale of ৳{order_amount} was made using your link.<br>You earned: ৳{commission}<br>Total Earnings: ৳{total_earnings}<br><br>Keep it up!'],
            ['smtp_host', ''],
            ['smtp_port', '587'],
            ['smtp_user', ''],
            ['smtp_pass', ''],
            ['smtp_secure', '0'],
            ['sender_email', 'noreply@example.com'],
            ['sender_name', 'My Store'],
            ['sms_api_key', ''],
            ['sms_sender_id', '']
        ];

        defaultSettings.forEach(([key, value]) => {
            const exists = db.prepare("SELECT 1 FROM settings WHERE setting_key = ?").get(key);
            if (!exists) {
                db.prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)").run(key, value);
            }
        });

        res.json({ status: 'success', messages: ['Database schema updated and settings initialized.'] });
    } catch (error: any) {
        console.error('Setup Auth Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.all('/api/admin.php', async (req, res) => {
    const action = req.query.action;

    if (action === 'check_session') {
      // Mock session check for now since we don't have full auth implemented
      // In a real app, you would check session cookies/tokens
      res.json({ logged_in: true, role: 'SUPER_ADMIN', name: 'Admin User', email: 'admin@example.com', id: 1 });
      return;
    }

    if (action === 'update_schema') {
        try {
            initDB();
            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
        return;
    }

    if (action === 'get_settings') {
        try {
            const settings = db.prepare("SELECT * FROM settings").all();
            const config: any = {};
            settings.forEach((s: any) => config[s.setting_key] = s.setting_value);
            res.json(config);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
        return;
    }

    if (action === 'get_orders') {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;
        const search = req.query.search as string || '';
        const status = req.query.status as string || 'ALL';
        const gateway = req.query.gateway as string || 'ALL';
        const startDate = req.query.start_date as string || '';
        const endDate = req.query.end_date as string || '';

        let whereClause = "WHERE 1=1";
        const params: any[] = [];

        if (search) {
          whereClause += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR id LIKE ?)";
          const searchParam = `%${search}%`;
          params.push(searchParam, searchParam, searchParam, searchParam);
        }

        if (startDate) {
          whereClause += " AND date(created_at) >= date(?)";
          params.push(startDate);
        }
        if (endDate) {
          whereClause += " AND date(created_at) <= date(?)";
          params.push(endDate);
        }

        // Stats Query (ignores status/gateway filter to show breakdown)
        const statsQuery = `SELECT 
          COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
          SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as revenue,
          SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as pending_amount
          FROM orders ${whereClause}`;
        
        const stats = db.prepare(statsQuery).get(...params);

        // List Query (respects all filters)
        if (status !== 'ALL') {
          whereClause += " AND status = ?";
          params.push(status);
        }
        if (gateway !== 'ALL') {
          whereClause += " AND gateway = ?"; // Assuming gateway column exists or needs to be added
          params.push(gateway);
        }

        const countQuery = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
        const totalResult = db.prepare(countQuery).get(...params);
        const total = totalResult.total;
        const totalPages = Math.ceil(total / limit);

        const ordersQuery = `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        const orders = db.prepare(ordersQuery).all(...params, limit, offset);

        res.json({
          orders,
          total,
          totalPages,
          stats: {
            paid: stats.paid || 0,
            pending: stats.pending || 0,
            revenue: stats.revenue || 0,
            pending_amount: stats.pending_amount || 0
          }
        });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
      return;
    }

    if (action === 'get_account_stats') {
        try {
            const startDate = req.query.start_date as string || '';
            const endDate = req.query.end_date as string || '';
            const status = req.query.status as string || 'PAID'; // Default to PAID for accounts

            let whereClause = "WHERE 1=1";
            const params: any[] = [];

            if (startDate) {
                whereClause += " AND date(created_at) >= date(?)";
                params.push(startDate);
            }
            if (endDate) {
                whereClause += " AND date(created_at) <= date(?)";
                params.push(endDate);
            }
            
            if (status !== 'ALL') {
                whereClause += " AND status = ?";
                params.push(status);
            }

            const summaryQuery = `SELECT 
                SUM(amount) as totalRevenue,
                COUNT(*) as totalCount,
                AVG(amount) as aov
                FROM orders ${whereClause}`;
            
            const summary = db.prepare(summaryQuery).get(...params);

            // Daily Breakdown
            const dailyQuery = `SELECT 
                date(created_at) as date,
                SUM(amount) as value
                FROM orders ${whereClause}
                GROUP BY date(created_at)
                ORDER BY date(created_at)`;
            
            const daily = db.prepare(dailyQuery).all(...params);

            res.json({
                summary: {
                    totalRevenue: summary.totalRevenue || 0,
                    totalCount: summary.totalCount || 0,
                    aov: Math.round(summary.aov || 0),
                    revenueGrowth: 0, // Placeholder
                    countGrowth: 0 // Placeholder
                },
                daily: daily || [],
                statuses: [],
                gateways: [],
                recentTransactions: []
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
        return;
    }

    if (action === 'get_recent_sales') {
      try {
        const enabledSetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_enabled'").get();
        const enabled = enabledSetting?.setting_value === '1';

        if (!enabled) {
          return res.json({ enabled: false, sales: [] });
        }

        let sales = db.prepare("SELECT name, created_at FROM orders WHERE status = 'PAID' ORDER BY created_at DESC LIMIT 20").all();
        
        // Check if Dummy Data is enabled
        const dummyEnabledSetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_dummy_enabled'").get();
        const dummyEnabled = dummyEnabledSetting?.setting_value === '1';

        if (dummyEnabled) {
            const dummyNames = ["Rahim", "Karim", "Suma", "Jamal", "Nadia", "Farhan", "Tisha", "Rubel", "Mimi", "Sohag"];
            const dummySales = dummyNames.map(name => {
                // Random time within last 24 hours
                const date = new Date();
                date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 1440));
                return {
                    name: name,
                    created_at: date.toISOString().replace('T', ' ').substring(0, 19)
                };
            });
            sales = [...sales, ...dummySales];
            // Sort by created_at desc
            sales.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            // Limit to 20
            sales = sales.slice(0, 20);
        }

        // If no sales (real or dummy), return empty
        if (sales.length === 0) {
             return res.json({ enabled: true, sales: [] });
        }
        
        const templatesSetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_templates'").get();
        const delaySetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_delay'").get();
        const durationSetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_duration'").get();

        let templates = [];
        try {
            templates = JSON.parse(templatesSetting?.setting_value || '[]');
        } catch (e) {
            templates = ['{name} from {location} purchased just now'];
        }
        
        if (templates.length === 0) {
            templates = ['{name} from {location} purchased just now'];
        }

        res.json({
          enabled: true,
          sales: sales,
          message_templates: templates,
          delay: parseInt(delaySetting?.setting_value || '5'),
          duration: parseInt(durationSetting?.setting_value || '5')
        });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
      return;
    }

    if (action === 'get_products') {
      try {
        const products = db.prepare("SELECT * FROM products").all();
        res.json({ products });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
      return;
    }

    if (action === 'save_product') {
      try {
        const { id, type, name, price, regular_price, image_url, file_url, description, status } = req.body;
        const parsedRegularPrice = regular_price === '' || regular_price === null || regular_price === undefined ? null : Number(regular_price);
        
        if (id) {
          db.prepare("UPDATE products SET type=?, name=?, price=?, regular_price=?, image_url=?, file_url=?, description=?, status=? WHERE id=?").run(
            type, name, price, parsedRegularPrice, image_url, file_url, description, status, id
          );
        } else {
          db.prepare("INSERT INTO products (type, name, price, regular_price, image_url, file_url, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
            type, name, price, parsedRegularPrice, image_url, file_url, description, status
          );
        }
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
      }
      return;
    }

    if (action === 'fix_database') {
      try {
        // Migration: Add regular_price to products if missing
        try {
          db.prepare("SELECT regular_price FROM products LIMIT 1").get();
        } catch (e) {
          try { db.prepare("ALTER TABLE products ADD COLUMN regular_price REAL").run(); } catch(err) {}
        }
        
        // Migration: Add affiliate columns to orders if missing
        try {
          db.prepare("SELECT affiliate_code FROM orders LIMIT 1").get();
        } catch (e) {
          try { db.prepare("ALTER TABLE orders ADD COLUMN affiliate_code TEXT").run(); } catch(err) {}
          try { db.prepare("ALTER TABLE orders ADD COLUMN commission_amount REAL DEFAULT 0").run(); } catch(err) {}
        }

        // Migration: Add gateway to orders if missing
        try {
          db.prepare("SELECT gateway FROM orders LIMIT 1").get();
        } catch (e) {
          try { db.prepare("ALTER TABLE orders ADD COLUMN gateway TEXT").run(); } catch(err) {}
        }

        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
      }
      return;
    }

    if (action === 'delete_product') {
      try {
        const { id } = req.body;
        db.prepare("DELETE FROM products WHERE id=?").run(id);
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
      }
      return;
    }

    if (action === 'get_integration_settings') {
      try {
        const settings = db.prepare("SELECT * FROM settings").all();
        const settingsMap: any = {};
        settings.forEach((s: any) => settingsMap[s.setting_key] = s.setting_value);
        res.json(settingsMap);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
      return;
    }

    if (action === 'save_integration_settings') {
      try {
        const input = req.body;
        const insertStmt = db.prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
        const updateStmt = db.prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?");
        const checkStmt = db.prepare("SELECT 1 FROM settings WHERE setting_key = ?");

        const transaction = db.transaction((data: any) => {
            for (const key in data) {
                const exists = checkStmt.get(key);
                if (exists) {
                    updateStmt.run(data[key], key);
                } else {
                    insertStmt.run(key, data[key]);
                }
            }
        });
        
        transaction(input);
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
      }
      return;
    }

    // Automation APIs
    if (action === 'get_automation_logs') {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 15; // Default 15 as requested
            const offset = (page - 1) * limit;
            const status = req.query.status as string || 'ALL';
            const startDate = req.query.start_date as string || '';
            const endDate = req.query.end_date as string || '';

            let whereClause = "WHERE 1=1";
            const params: any[] = [];

            if (status !== 'ALL') {
                whereClause += " AND status = ?";
                params.push(status);
            }
            if (startDate) {
                whereClause += " AND date(created_at) >= date(?)";
                params.push(startDate);
            }
            if (endDate) {
                whereClause += " AND date(created_at) <= date(?)";
                params.push(endDate);
            }

            const countQuery = `SELECT COUNT(*) as total FROM automation_logs ${whereClause}`;
            const totalResult = db.prepare(countQuery).get(...params);
            const total = totalResult.total;
            const totalPages = Math.ceil(total / limit);

            const logsQuery = `SELECT * FROM automation_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            const logs = db.prepare(logsQuery).all(...params, limit, offset);

            res.json({ logs, total, totalPages, currentPage: page });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
        return;
    }

    if (action === 'get_automation_settings') {
        try {
            const keys = ['automation_day1', 'automation_day3', 'automation_day5', 'automation_paid_level1', 'automation_paid_level2', 'automation_paid_level3'];
            const settings = db.prepare(`SELECT * FROM settings WHERE setting_key IN (${keys.map(() => '?').join(',')})`).all(...keys);
            
            const config: any = {};
            settings.forEach((s: any) => {
                try {
                    config[s.setting_key.replace('automation_', '')] = JSON.parse(s.setting_value);
                } catch (e) {
                    config[s.setting_key.replace('automation_', '')] = {};
                }
            });
            
            res.json(config);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
        return;
    }

    if (action === 'save_automation_settings') {
        try {
            const input = req.body;
            const insertStmt = db.prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
            const updateStmt = db.prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?");
            const checkStmt = db.prepare("SELECT 1 FROM settings WHERE setting_key = ?");

            const transaction = db.transaction((data: any) => {
                for (const key in data) {
                    const dbKey = `automation_${key}`;
                    const value = JSON.stringify(data[key]);
                    const exists = checkStmt.get(dbKey);
                    if (exists) {
                        updateStmt.run(value, dbKey);
                    } else {
                        insertStmt.run(dbKey, value);
                    }
                }
            });
            
            transaction(input);
            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
        return;
    }

    if (action === 'run_automation') {
        try {
            // Mock Automation Run
            // In real scenario, fetch pending orders created X days ago and send messages
            
            // Fetch settings to show we are using them
            const keys = ['automation_day1', 'automation_day3', 'automation_day5', 'automation_paid_level1', 'automation_paid_level2', 'automation_paid_level3'];
            const settings = db.prepare(`SELECT * FROM settings WHERE setting_key IN (${keys.map(() => '?').join(',')})`).all(...keys);
            
            // Log a mock entry
            db.prepare("INSERT INTO automation_logs (name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?)").run(
                'System', 'N/A', 'SYSTEM', `Manual automation run triggered. Settings loaded: ${settings.length}`, 'SENT'
            );

            res.json({ success: true, message: 'Automation triggered successfully' });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
        return;
    }

    if (action === 'update_schema') {
        try {
            initDB();
            res.json({ success: true, message: 'Schema updated and migrations run successfully' });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
        return;
    }
    
    if (action === 'update_order_details') {
        try {
            const { id, name, email, phone, amount, status, gateway, transaction_id, affiliate_code } = req.body;
            
            const currentOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
            if (!currentOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            // Update Order
            db.prepare(`
                UPDATE orders 
                SET name = ?, email = ?, phone = ?, amount = ?, status = ?, gateway = ?, transaction_id = ?, affiliate_code = ?
                WHERE id = ?
            `).run(name, email, phone, amount, status, gateway, transaction_id, affiliate_code, id);

            // Handle Affiliate Commission if status changed to PAID
            if (status === 'PAID' && currentOrder.status !== 'PAID' && affiliate_code) {
                const affiliate = db.prepare("SELECT * FROM affiliates WHERE code = ?").get(affiliate_code);
                
                // Check if commission already exists for this order (idempotency)
                const existingComm = db.prepare("SELECT * FROM affiliate_transactions WHERE source_order_id = ? AND type = 'COMMISSION'").get(id);

                if (affiliate && !existingComm && affiliate.email !== email) {
                     const percent = parseFloat(db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_commission_percent'").get()?.setting_value || '20');
                     const commission = Math.round((amount * percent) / 100);

                     if (commission > 0) {
                        // Update Balance & Add Transaction
                        db.prepare("UPDATE affiliates SET balance = balance + ?, total_earnings = total_earnings + ? WHERE id = ?").run(commission, commission, affiliate.id);
                        db.prepare("INSERT INTO affiliate_transactions (affiliate_id, amount, type, source_order_id, created_at) VALUES (?, ?, 'COMMISSION', ?, CURRENT_TIMESTAMP)").run(affiliate.id, commission, id);
                        
                        // Update Order with commission amount
                        db.prepare("UPDATE orders SET commission_amount = ? WHERE id = ?").run(commission, id);

                        // Send Notifications
                        const affiliateUser = db.prepare("SELECT name, phone FROM orders WHERE email = ? LIMIT 1").get(affiliate.email);
                        const affiliateName = affiliateUser ? affiliateUser.name : 'Partner';
                        const affiliatePhone = affiliateUser ? affiliateUser.phone : 'N/A';
                        
                        // Re-fetch updated affiliate for accurate totals
                        const updatedAffiliate = db.prepare("SELECT * FROM affiliates WHERE id = ?").get(affiliate.id);

                        const notificationPayload = {
                            affiliateName,
                            affiliatePhone,
                            affiliateEmail: affiliate.email,
                            commission,
                            totalEarnings: updatedAffiliate.total_earnings,
                            orderAmount: amount,
                            affiliateCode: affiliate.code,
                            orderId: id
                        };

                        const smsTemplate = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_sms'").get()?.setting_value;
                        const emailSubjectTemplate = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_email_subject'").get()?.setting_value;
                        const emailBodyTemplate = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_email_body'").get()?.setting_value;

                        const replaceTags = (text: string) => {
                            return text
                                .replace(/{name}/g, notificationPayload.affiliateName)
                                .replace(/{commission}/g, notificationPayload.commission.toString())
                                .replace(/{total_earnings}/g, notificationPayload.totalEarnings.toString())
                                .replace(/{order_amount}/g, notificationPayload.orderAmount.toString())
                                .replace(/{code}/g, notificationPayload.affiliateCode);
                        };

                        if (smsTemplate && notificationPayload.affiliatePhone !== 'N/A') {
                            const msg = replaceTags(smsTemplate);
                            sendSMS(notificationPayload.affiliatePhone, msg).then(sent => {
                                db.prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?, ?)").run(
                                    id, notificationPayload.affiliateName, notificationPayload.affiliatePhone, 'AFFILIATE_SMS', msg, sent ? 'SENT' : 'FAILED'
                                );
                            });
                        }

                        if (emailBodyTemplate) {
                            const subject = replaceTags(emailSubjectTemplate || 'New Commission');
                            const body = replaceTags(emailBodyTemplate);
                            sendEmail(notificationPayload.affiliateEmail, subject, body).then(sent => {
                                db.prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?, ?)").run(
                                    id, notificationPayload.affiliateName, notificationPayload.affiliateEmail, 'AFFILIATE_EMAIL', `Subject: ${subject}\n\n${body}`, sent ? 'SENT' : 'FAILED'
                                );
                            });
                        }
                     }
                }
            }

            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
        return;
    }

    if (action === 'resend_notification') {
        try {
            const { order_id, type } = req.body;
            const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(order_id);
            
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

            // Fetch automation settings to get templates
            const automationSettings = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'automation_settings'").get();
            let config: any = {};
            try {
                config = JSON.parse(automationSettings?.setting_value || '{}');
            } catch (e) {}

            if (type === 'sms') {
                // Default to paid_level1 template or generic
                let msg = config.paid_level1?.sms || `Hi {name}, thanks for your purchase!`;
                msg = msg.replace(/{name}/g, order.name);
                
                const sent = await sendSMS(order.phone, msg);
                
                // Log
                db.prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?, ?)").run(
                    order.id, order.name, order.phone, 'MANUAL_RESEND_SMS', msg, sent ? 'SENT' : 'FAILED'
                );

                res.json({ success: sent });
            } else if (type === 'email') {
                let subject = config.paid_level1?.email_subject || 'Order Confirmation';
                let body = config.paid_level1?.email_body || `Hi {name}, thanks for your purchase!`;
                
                subject = subject.replace(/{name}/g, order.name);
                body = body.replace(/{name}/g, order.name);
                
                const sent = await sendEmail(order.email, subject, body);
                
                // Log
                db.prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?, ?)").run(
                    order.id, order.name, order.phone, 'MANUAL_RESEND_EMAIL', `Subject: ${subject}`, sent ? 'SENT' : 'FAILED'
                );

                res.json({ success: sent });
            } else {
                res.json({ success: false, message: 'Invalid type' });
            }
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
        return;
    }

    if (action === 'send_custom_message') {
        try {
            const { order_id, message } = req.body;
            const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(order_id);
            
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

            const sent = await sendSMS(order.phone, message);
            
            // Log it
            db.prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?, ?)").run(
                order_id, order.name, order.phone, 'CUSTOM_SMS', message, sent ? 'SENT' : 'FAILED'
            );

            res.json({ success: sent });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
        return;
    }

    // Fallback for other actions
    res.json({ success: false, message: 'Action not implemented in Node.js backend yet' });
  });

  // Public Settings API
  app.get('/api/get_public_settings.php', async (req, res) => {
     try {
        const settings = db.prepare("SELECT * FROM settings").all();
        const settingsMap: any = {};
        settings.forEach((s: any) => settingsMap[s.setting_key] = s.setting_value);
        
        // Only expose public settings
        const publicSettings = {
            gtm_id: settingsMap['gtm_id'] || '',
            ga4_id: settingsMap['ga4_id'] || '',
            fb_pixel_id: settingsMap['fb_pixel_id'] || '',
            oto_enabled: settingsMap['oto_enabled'] || '0',
            oto_image_url: settingsMap['oto_image_url'] || '',
            oto_copy: settingsMap['oto_copy'] || '',
            oto_coupon_code: settingsMap['oto_coupon_code'] || '',
            oto_link: settingsMap['oto_link'] || ''
        };
        res.json(publicSettings);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
  });

  // Public Products API
  app.get('/api/get_public_products.php', async (req, res) => {
     try {
        const products = db.prepare("SELECT * FROM products WHERE status = 'ACTIVE'").all();
        res.json({ products });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
  });

  // Public Recent Sales API (Social Proof)
  app.get('/api/get_public_recent_sales.php', async (req, res) => {
      try {
        const enabledSetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_enabled'").get();
        const enabled = enabledSetting?.setting_value === '1';

        if (!enabled) {
          return res.json({ enabled: false, sales: [] });
        }

        let sales = db.prepare("SELECT name, created_at FROM orders WHERE status = 'PAID' ORDER BY created_at DESC LIMIT 20").all();
        
        // Check if Dummy Data is enabled
        const dummyEnabledSetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_dummy_enabled'").get();
        const dummyEnabled = dummyEnabledSetting?.setting_value === '1';

        if (dummyEnabled) {
            const dummyNames = ["Rahim", "Karim", "Suma", "Jamal", "Nadia", "Farhan", "Tisha", "Rubel", "Mimi", "Sohag"];
            const dummySales = dummyNames.map(name => {
                const date = new Date();
                date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 1440));
                return {
                    name: name,
                    created_at: date.toISOString().replace('T', ' ').substring(0, 19)
                };
            });
            sales = [...sales, ...dummySales];
            sales.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            sales = sales.slice(0, 20);
        }

        if (sales.length === 0) {
             return res.json({ enabled: true, sales: [] });
        }
        
        const templatesSetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_templates'").get();
        const delaySetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_delay'").get();
        const durationSetting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_duration'").get();

        let templates = [];
        try {
            templates = JSON.parse(templatesSetting?.setting_value || '[]');
        } catch (e) {
            templates = ['{name} from {location} purchased just now'];
        }
        
        if (templates.length === 0) {
            templates = ['{name} from {location} purchased just now'];
        }

        res.json({
          enabled: true,
          sales: sales,
          message_templates: templates,
          delay: parseInt(delaySetting?.setting_value || '5'),
          duration: parseInt(durationSetting?.setting_value || '5')
        });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
  });

  // Create Lead
  app.post('/api/create_lead.php', async (req, res) => {
      console.log('Create Lead Request:', req.body);
      try {
          const { name, email, phone, gateway, coupon_code, upsell_ids } = req.body;
          
          // Check if already purchased
          const existing = db.prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PAID'").get(email, phone);
          if (existing) {
              return res.json({ status: 'already_purchased', message: 'You have already purchased this product.' });
          }

          // Calculate Amount
          let amount = 199;
          const mainProduct = db.prepare("SELECT price FROM products WHERE type = 'main' AND status = 'ACTIVE' LIMIT 1").get();
          if (mainProduct && mainProduct.price !== undefined && mainProduct.price !== null) {
              amount = parseFloat(mainProduct.price);
          }
          
          // Add Upsells
          if (upsell_ids && upsell_ids.length > 0) {
              const upsells = db.prepare(`SELECT price FROM products WHERE id IN (${upsell_ids.map(() => '?').join(',')})`).all(...upsell_ids);
              upsells.forEach((u: any) => amount += u.price);
          }

          // Apply Coupon
          if (coupon_code) {
              const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND status = 'ACTIVE'").get(coupon_code);
              if (coupon) {
                  if (coupon.type === 'fixed') amount -= coupon.amount;
                  else amount -= (amount * coupon.amount / 100);
              }
          }
          
          amount = Math.max(0, Math.round(amount));

          // Create or Update Pending Order
          const pending = db.prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PENDING'").get(email, phone);
          if (pending) {
              db.prepare("UPDATE orders SET name = ?, amount = ?, gateway = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?").run(name, amount, gateway, pending.id);
          } else {
              db.prepare("INSERT INTO orders (name, email, phone, amount, status, gateway) VALUES (?, ?, ?, ?, 'PENDING', ?)").run(name, email, phone, amount, gateway);
          }

          res.json({ status: 'success', message: 'Lead created successfully' });
      } catch (e: any) {
          res.status(500).json({ status: 'error', message: e.message });
      }
  });

  // Validate Coupon
  app.post('/api/validate_coupon.php', async (req, res) => {
      try {
          const { code } = req.body;
          const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND status = 'ACTIVE'").get(code);
          
          if (!coupon) {
              return res.json({ valid: false, message: 'Invalid Coupon Code' });
          }

          // Check Expiry
          if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
              return res.json({ valid: false, message: 'Coupon Expired' });
          }

          // Check Usage Limit
          if (coupon.usage_limit !== -1 && coupon.usage_count >= coupon.usage_limit) {
              return res.json({ valid: false, message: 'Coupon Usage Limit Exceeded' });
          }

          res.json({ 
              valid: true, 
              code: coupon.code, 
              type: coupon.type, 
              amount: coupon.amount 
          });
      } catch (e: any) {
          res.status(500).json({ valid: false, message: e.message });
      }
  });

  // Checkout (Finalize)
  app.post('/api/checkout.php', async (req, res) => {
      console.log('Checkout Request:', req.body);
      try {
          const { name, email, phone, gateway, coupon_code, upsell_ids, affiliate_code } = req.body;
          
          // Check if already purchased
          const existing = db.prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PAID'").get(email, phone);
          if (existing) {
              return res.json({ status: 'already_purchased', message: 'You have already purchased this product.' });
          }

          // Re-calculate amount (security)
          let amount = 199;
          const mainProduct = db.prepare("SELECT price FROM products WHERE type = 'main' AND status = 'ACTIVE' LIMIT 1").get();
          if (mainProduct && mainProduct.price !== undefined && mainProduct.price !== null) {
              amount = parseFloat(mainProduct.price);
          }
          
          if (upsell_ids && upsell_ids.length > 0) {
              const upsells = db.prepare(`SELECT price FROM products WHERE id IN (${upsell_ids.map(() => '?').join(',')})`).all(...upsell_ids);
              upsells.forEach((u: any) => amount += u.price);
          }

          if (coupon_code) {
              const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND status = 'ACTIVE'").get(coupon_code);
              if (coupon) {
                  if (coupon.type === 'fixed') amount -= coupon.amount;
                  else amount -= (amount * coupon.amount / 100);
                  
                  // Increment usage count
                  db.prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?").run(coupon.id);
              }
          }
          
          amount = Math.max(0, Math.round(amount));

          // Update Order to PAID (Mock Payment Success)
          // In real scenario, this would initiate payment gateway redirect
          // For now, we simulate success and redirect to success page
          
          let commission = 0;
          let validAffiliate = null;

          // Affiliate Logic
          if (affiliate_code) {
              validAffiliate = db.prepare("SELECT * FROM affiliates WHERE code = ?").get(affiliate_code);
              // Prevent self-referral (optional, check email)
              if (validAffiliate && validAffiliate.email !== email) {
                  const percent = parseFloat(db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_commission_percent'").get()?.setting_value || '20');
                  commission = Math.round((amount * percent) / 100);
              } else {
                  validAffiliate = null; // Invalid or self-referral
              }
          }

          const pending = db.prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PENDING'").get(email, phone);
          
          let notificationPayload: any = null;
          const transaction = db.transaction(() => {
              let orderId = 0;
              if (pending) {
                  db.prepare("UPDATE orders SET status = 'PAID', payment_date = CURRENT_TIMESTAMP, amount = ?, gateway = ?, affiliate_code = ?, commission_amount = ? WHERE id = ?").run(amount, gateway, validAffiliate?.code || null, commission, pending.id);
                  orderId = pending.id;
              } else {
                   // Should have been created in create_lead, but handle edge case
                  const info = db.prepare("INSERT INTO orders (name, email, phone, amount, status, gateway, payment_date, affiliate_code, commission_amount) VALUES (?, ?, ?, ?, 'PAID', ?, CURRENT_TIMESTAMP, ?, ?)").run(name, email, phone, amount, gateway, validAffiliate?.code || null, commission);
                  orderId = Number(info.lastInsertRowid);
              }

              // Credit Affiliate
              if (validAffiliate && commission > 0) {
                  db.prepare("UPDATE affiliates SET balance = balance + ?, total_earnings = total_earnings + ? WHERE id = ?").run(commission, commission, validAffiliate.id);
                  db.prepare("INSERT INTO affiliate_transactions (affiliate_id, amount, type, source_order_id, created_at) VALUES (?, ?, 'COMMISSION', ?, CURRENT_TIMESTAMP)").run(validAffiliate.id, commission, orderId);
                  
                  // Prepare Notification Payload (Executed outside transaction)
                  try {
                      const updatedAffiliate = db.prepare("SELECT * FROM affiliates WHERE id = ?").get(validAffiliate.id);
                      const affiliateUser = db.prepare("SELECT name, phone FROM orders WHERE email = ? LIMIT 1").get(updatedAffiliate.email);
                      
                      notificationPayload = {
                          affiliateName: affiliateUser ? affiliateUser.name : 'Partner',
                          affiliatePhone: affiliateUser ? affiliateUser.phone : 'N/A',
                          affiliateEmail: updatedAffiliate.email,
                          commission: commission,
                          totalEarnings: updatedAffiliate.total_earnings,
                          orderAmount: amount,
                          affiliateCode: updatedAffiliate.code,
                          orderId: orderId
                      };
                  } catch (err) {
                      console.error("Error preparing notification payload:", err);
                  }
              }
              return orderId;
          });
          
          const orderId = transaction();

          // Send Customer Success Email
          const successSubject = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'success_email_subject'").get()?.setting_value || 'Download Your অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট eBook';
          const successBody = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'success_email_body'").get()?.setting_value || '';
          
          let emailBody = successBody;
          const downloadLink = `${process.env.SITE_URL || 'https://organic.shehzin.com'}/api/download.php?order_id=${orderId}`;

          if (!emailBody) {
              // Default Template
              emailBody = `
              <html>
              <head><title>Download Your Files</title></head>
              <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
                <div style='max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px;'>
                  <h2 style='color: #4f46e5;'>Congratulations, ${name}!</h2>
                  <p>Thank you for purchasing <strong>'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট'</strong>.</p>
                  <p>Your order (ID: #${orderId}) is confirmed.</p>
                  <br>
                  <a href='${downloadLink}' style='background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Download eBook PDF</a>
                  <br><br>
                  <p style='font-size: 12px; color: #666;'>Or click here: <a href='${downloadLink}'>${downloadLink}</a></p>
                  
                  <div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-top: 20px;'>
                      <h3 style='color: #166534; margin-top:0;'>Bonus: Join Secret Facebook Group</h3>
                      <p style='color: #166534; font-size: 14px;'>Join our exclusive Facebook group to practice with others.</p>
                      <a href='https://www.facebook.com/groups/LearningBangladesh71' style='color: #15803d; font-weight: bold; text-decoration: underline;'>Join Facebook Group</a>
                  </div>
          
                  <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                  <p>For any help, simply reply to this email.</p>
                  <p>Happy Learning,<br><strong>Shehzin Publications</strong></p>
                </div>
              </body>
              </html>`;
          } else {
              // Replace placeholders
              emailBody = emailBody
                  .replace(/{name}/g, name)
                  .replace(/{order_id}/g, orderId.toString())
                  .replace(/{download_link}/g, downloadLink)
                  .replace(/{site_url}/g, process.env.SITE_URL || 'https://organic.shehzin.com');
          }

          sendEmail(email, successSubject, emailBody).then(sent => {
               console.log(`Customer success email sent to ${email}: ${sent}`);
          });

          // Send Notifications (Async)
          if (notificationPayload) {
              const { affiliateName, affiliatePhone, affiliateEmail, commission, totalEarnings, orderAmount, affiliateCode, orderId } = notificationPayload;
              
              const smsTemplate = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_sms'").get()?.setting_value;
              const emailSubjectTemplate = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_email_subject'").get()?.setting_value;
              const emailBodyTemplate = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_notification_email_body'").get()?.setting_value;

              const replaceTags = (text: string) => {
                  return text
                      .replace(/{name}/g, affiliateName)
                      .replace(/{commission}/g, commission.toString())
                      .replace(/{total_earnings}/g, totalEarnings.toString())
                      .replace(/{order_amount}/g, orderAmount.toString())
                      .replace(/{code}/g, affiliateCode);
              };

              if (smsTemplate) {
                  const msg = replaceTags(smsTemplate);
                  sendSMS(affiliatePhone, msg).then(sent => {
                      db.prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?, ?)").run(
                          orderId, affiliateName, affiliatePhone, 'AFFILIATE_SMS', msg, sent ? 'SENT' : 'FAILED'
                      );
                  });
              }

              if (emailBodyTemplate) {
                  const subject = replaceTags(emailSubjectTemplate || 'New Commission');
                  const body = replaceTags(emailBodyTemplate);
                  
                  sendEmail(affiliateEmail, subject, body).then((sent) => {
                      db.prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, ?, ?, ?)").run(
                          orderId, affiliateName, affiliateEmail, 'AFFILIATE_EMAIL', `Subject: ${subject}\n\n${body}`, sent ? 'SENT' : 'FAILED'
                      );
                  });
              }
          }

          res.json({ status: 'success', redirect_url: '/#/success' });
      } catch (e: any) {
          res.status(500).json({ status: 'error', message: e.message });
      }
  });

  // Resend Access
  app.post('/api/resend_access.php', async (req, res) => {
      try {
          const { email, phone } = req.body;
          const order = db.prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PAID'").get(email, phone);
          
          if (order) {
              // Mock email sending
              res.json({ status: 'success', message: 'Access link sent to your email.' });
          } else {
              res.json({ status: 'error', message: 'No paid order found with this email/phone.' });
          }
      } catch (e: any) {
          res.status(500).json({ status: 'error', message: e.message });
      }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
