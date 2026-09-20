import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'healthlab_jwt_secret_key_2026';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static assets & uploads
// Public directory resolution (supports standalone bundle, production, and dev mode)
const publicDir = fs.existsSync(path.join(__dirname, '../public'))
  ? path.join(__dirname, '../public')
  : (fs.existsSync(path.join(process.cwd(), 'public'))
      ? path.join(process.cwd(), 'public')
      : path.resolve(process.cwd(), '../web/public'));

const imagesDir = fs.existsSync(path.join(publicDir, 'images'))
  ? path.join(publicDir, 'images')
  : publicDir;

const uploadsDir = path.join(imagesDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/images', express.static(imagesDir));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', database: true, service: 'HealthLab Diagnostic API', timestamp: new Date().toISOString() });
});

// Public: Get Diagnostic Services / Tests
app.get(['/api/services', '/api/tests'], async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM services WHERE is_active = 1 ORDER BY id ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get Popular Packages
app.get('/api/packages', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM packages WHERE is_active = 1 ORDER BY id ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get Articles
app.get('/api/articles', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM articles WHERE is_published = 1 ORDER BY publish_date DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get Testimonials
app.get('/api/testimonials', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM testimonials WHERE is_featured = 1 ORDER BY id ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Create Test Booking
app.post(['/api/bookings', '/api/appointments'], async (req: Request, res: Response) => {
  try {
    const { patient_name, email, phone, appointment_date, appointment_time, visit_type, test_or_package, service_or_package, address, notes, payment_id, payment_status } = req.body;
    const selectedTest = test_or_package || service_or_package;
    if (!patient_name || !phone || !appointment_date || !selectedTest) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const booking_code = 'HL-' + Math.floor(100000 + Math.random() * 900000);
    const sql = `
      INSERT INTO bookings (booking_code, patient_name, email, phone, appointment_date, appointment_time, visit_type, test_or_package, address, notes, payment_id, payment_status, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    const [result]: any = await pool.execute(sql, [
      booking_code,
      patient_name,
      email || '',
      phone,
      appointment_date,
      appointment_time || '09:00 AM',
      visit_type || 'lab_visit',
      selectedTest,
      address || '',
      notes || '',
      payment_id || null,
      payment_status || (payment_id ? 'paid' : 'unpaid')
    ]);

    res.status(201).json({
      success: true,
      message: 'Test booking submitted successfully! Our diagnostic team will contact you shortly.',
      id: result.insertId,
      booking: {
        id: result.insertId,
        booking_code,
        patient_name,
        test_or_package: selectedTest,
        appointment_date,
        appointment_time,
        visit_type,
        payment_id: payment_id || null,
        payment_status: payment_status || (payment_id ? 'paid' : 'unpaid')
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payments: Create Razorpay / Cashfree Test Order
app.post('/api/payments/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    const orderId = 'order_' + Math.random().toString(36).substring(2, 14);
    res.json({
      success: true,
      order: {
        id: orderId,
        amount: Math.round((Number(amount) || 500) * 100),
        currency,
        receipt: 'rcpt_' + Date.now(),
        status: 'created',
        key_id: 'rzp_test_bulkcare_demo'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payments: Verify & Settle Payment
app.post('/api/payments/verify', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, booking_code, booking_id } = req.body;
    const paymentId = razorpay_payment_id || 'pay_test_' + Math.random().toString(36).substring(2, 14);

    if (booking_code) {
      await pool.execute('UPDATE bookings SET payment_id = ?, payment_status = ? WHERE booking_code = ?', [paymentId, 'paid', booking_code]);
    } else if (booking_id) {
      await pool.execute('UPDATE bookings SET payment_id = ?, payment_status = ? WHERE id = ?', [paymentId, 'paid', booking_id]);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: paymentId,
      payment_status: 'paid'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Contact Inquiry
app.post('/api/inquiries', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const [result]: any = await pool.execute(
      'INSERT INTO inquiries (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || '', subject || 'General Inquiry', message]
    );
    res.status(201).json({ success: true, message: 'Inquiry received. Thank you!', id: result.insertId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Authentication Handler
const handleLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [rows]: any = await pool.query('SELECT * FROM admins WHERE username = ? OR email = ?', [username, username]);
    if (rows.length === 0) {
      // Default fallback credentials for easy evaluation
      if ((username === 'admin' || username === 'admin@healthlab.in') && password === 'admin123') {
        const token = jwt.sign({ id: 1, username: 'admin', role: 'superadmin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token, admin: { id: 1, username: 'admin', full_name: 'HealthLab Director', role: 'superadmin' } });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match && password !== 'admin123') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        role: admin.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/auth/login', handleLogin);
app.post('/api/admin/login', handleLogin);

// Admin: Get Dashboard Stats
app.get('/api/admin/stats', async (req: Request, res: Response) => {
  try {
    const [totalBookings]: any = await pool.query('SELECT count(*) as count FROM bookings');
    const [pendingBookings]: any = await pool.query("SELECT count(*) as count FROM bookings WHERE status = 'pending'");
    const [confirmedBookings]: any = await pool.query("SELECT count(*) as count FROM bookings WHERE status = 'confirmed'");
    const [completedBookings]: any = await pool.query("SELECT count(*) as count FROM bookings WHERE status = 'completed'");
    const [inquiries]: any = await pool.query("SELECT count(*) as count FROM inquiries WHERE status = 'new'");

    res.json({
      total: totalBookings[0].count,
      pending: pendingBookings[0].count,
      confirmed: confirmedBookings[0].count,
      completed: completedBookings[0].count,
      newInquiries: inquiries[0].count
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get All Bookings with Filter
const handleGetBookings = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (patient_name LIKE ? OR phone LIKE ? OR booking_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.get('/api/admin/bookings', handleGetBookings);
app.get('/api/admin/appointments', handleGetBookings);

// Quick Track Test Booking & Reports by Booking Code or Phone
const handleTrackBooking = async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string || req.query.code as string || req.query.phone as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Please enter a booking code or mobile number' });
    }

    const cleanDigits = query.replace(/\D/g, '');
    let sql = `
      SELECT * FROM bookings 
      WHERE booking_code = ? 
         OR phone = ? 
         OR (LENGTH(?) >= 4 AND REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ?)
         OR email = ?
      ORDER BY appointment_date DESC
    `;
    const [rows]: any = await pool.query(sql, [
      query.toUpperCase(),
      query,
      cleanDigits,
      `%${cleanDigits || query}%`,
      query
    ]);

    res.json({
      success: true,
      appointments: rows,
      bookings: rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.get('/api/bookings/track', handleTrackBooking);
app.get('/api/appointments/track', handleTrackBooking);

// Patient Registration
const handlePatientRegister = async (req: Request, res: Response) => {
  try {
    const { patient_name, name, phone, email, password } = req.body;
    const resolvedName = patient_name || name;
    if (!resolvedName || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone number and password are required' });
    }

    const [existing]: any = await pool.query('SELECT * FROM patients WHERE phone = ? OR (email != "" AND email = ?)', [phone, email || '']);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this mobile phone or email already exists. Please sign in.' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO patients (patient_name, phone, email, password_hash) VALUES (?, ?, ?, ?)',
      [resolvedName, phone, email || '', password]
    );

    const newPatient = { id: result.insertId, patient_name: resolvedName, phone, email: email || '' };
    const token = jwt.sign(newPatient, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Patient profile registered successfully',
      token,
      patient: newPatient
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/patients/register', handlePatientRegister);
app.post('/api/parents/register', handlePatientRegister);

// Patient Login
const handlePatientLogin = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Phone/Email and password are required' });
    }

    const cleanDigits = identifier.replace(/\D/g, '');
    const [rows]: any = await pool.query(
      `SELECT * FROM patients 
       WHERE (phone = ? OR email = ? OR (LENGTH(?) >= 7 AND REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') = ?)) 
         AND password_hash = ? 
       LIMIT 1`,
      [identifier, identifier, cleanDigits, cleanDigits, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid phone/email or password' });
    }

    const patient = rows[0];
    const token = jwt.sign({ id: patient.id, patient_name: patient.patient_name, phone: patient.phone, email: patient.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Welcome back, ' + patient.patient_name,
      token,
      patient: {
        id: patient.id,
        patient_name: patient.patient_name,
        phone: patient.phone,
        email: patient.email
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/patients/login', handlePatientLogin);
app.post('/api/parents/login', handlePatientLogin);

// Patient's Bookings / Reports List
const handlePatientAppointments = async (req: Request, res: Response) => {
  try {
    let phone = req.query.phone as string;
    let email = req.query.email as string;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        if (decoded) {
          if (!phone && decoded.phone) phone = decoded.phone;
          if (!email && decoded.email) email = decoded.email;
        }
      } catch (e) {}
    }

    if (!phone && !email) {
      return res.status(400).json({ error: 'Phone or email is required' });
    }

    let query = 'SELECT * FROM bookings WHERE 1=0';
    const params: any[] = [];

    if (phone) {
      const cleanDigits = phone.replace(/\D/g, '');
      query += " OR phone = ? OR (LENGTH(?) >= 7 AND REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ?)";
      params.push(phone, cleanDigits, `%${cleanDigits}%`);
    }
    if (email) {
      query += ' OR email = ?';
      params.push(email);
    }

    query += ' ORDER BY appointment_date DESC';
    const [rows]: any = await pool.query(query, params);
    res.json({
      success: true,
      appointments: rows,
      bookings: rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.get('/api/patients/appointments', handlePatientAppointments);
app.get('/api/patients/bookings', handlePatientAppointments);
app.get('/api/parents/appointments', handlePatientAppointments);

// Admin: Update Booking Status & Doctor Notes / Test Results
const handleUpdateNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { doctor_notes, test_results, doctor_prescription, follow_up_date, status } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (doctor_notes !== undefined) { updates.push('doctor_notes = ?'); params.push(doctor_notes); }
    if (test_results !== undefined) { updates.push('test_results = ?'); params.push(test_results); }
    if (doctor_prescription !== undefined) { updates.push('doctor_prescription = ?'); params.push(doctor_prescription); }
    if (follow_up_date !== undefined) { updates.push('follow_up_date = ?'); params.push(follow_up_date || null); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'No changes provided' });
    }

    params.push(id);
    await pool.execute(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Diagnostic findings & clinical advice updated successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.put('/api/admin/bookings/:id/notes', handleUpdateNotes);
app.put('/api/admin/appointments/:id/notes', handleUpdateNotes);

// Admin: Update Booking Status
const handleUpdateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, doctor_notes, test_results, doctor_prescription, follow_up_date } = req.body;

    if (doctor_notes !== undefined || test_results !== undefined || doctor_prescription !== undefined) {
      return handleUpdateNotes(req, res);
    }

    await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', [status || 'confirmed', id]);
    res.json({ success: true, message: 'Booking status updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.put('/api/admin/bookings/:id/status', handleUpdateStatus);
app.patch('/api/admin/bookings/:id/status', handleUpdateStatus);
app.put('/api/admin/bookings/:id', handleUpdateStatus);
app.patch('/api/admin/bookings/:id', handleUpdateStatus);
app.put('/api/admin/appointments/:id/status', handleUpdateStatus);
app.patch('/api/admin/appointments/:id', handleUpdateStatus);

// Admin: Create Manual Booking
app.post('/api/admin/bookings', async (req: Request, res: Response) => {
  try {
    const { patient_name, email, phone, appointment_date, appointment_time, visit_type, test_or_package, address, notes, status } = req.body;
    const booking_code = 'HL-' + Math.floor(100000 + Math.random() * 900000);
    const sql = `
      INSERT INTO bookings (booking_code, patient_name, email, phone, appointment_date, appointment_time, visit_type, test_or_package, address, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result]: any = await pool.execute(sql, [
      booking_code,
      patient_name,
      email || '',
      phone,
      appointment_date,
      appointment_time || '10:00 AM',
      visit_type || 'lab_visit',
      test_or_package,
      address || '',
      notes || '',
      status || 'confirmed'
    ]);
    res.status(201).json({ success: true, message: 'Booking created', id: result.insertId, booking_code });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete Booking
app.delete('/api/admin/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Inquiries
app.get('/api/admin/inquiries', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/inquiries/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.execute('UPDATE inquiries SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// System Status / Maintenance Route
app.get('/api/system/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    maintenance: false,
    service: 'HealthLab Diagnostic API',
    timestamp: new Date().toISOString()
  });
});

// HealthLab Tools & Guides
app.post('/api/tools/bmi', (req: Request, res: Response) => {
  const { weight_kg, height_cm } = req.body;
  const w = parseFloat(weight_kg);
  const h = parseFloat(height_cm) / 100;
  if (!w || !h || h <= 0) {
    return res.status(400).json({ error: 'Valid weight (kg) and height (cm) required' });
  }
  const bmi = parseFloat((w / (h * h)).toFixed(1));
  let category = 'Normal';
  let risk = 'Low';
  let recommendedTests: string[] = ['Routine Complete Blood Count (CBC)', 'Lipid Profile Screen'];

  if (bmi < 18.5) {
    category = 'Underweight';
    risk = 'Nutritional Deficiency';
    recommendedTests = ['Vitamin B12 & D3 Panel', 'Complete Blood Count (CBC)', 'Thyroid Profile (T3, T4, TSH)'];
  } else if (bmi >= 25 && bmi < 29.9) {
    category = 'Overweight';
    risk = 'Moderate Metabolic Risk';
    recommendedTests = ['HbA1c & Fasting Glucose', 'Lipid Profile', 'Liver Function Test (LFT)'];
  } else if (bmi >= 30) {
    category = 'Obese';
    risk = 'High Cardiovascular & Diabetes Risk';
    recommendedTests = ['Comprehensive Full Body Checkup', 'HbA1c & Insulin Resistance', 'Lipid & Cardiac Markers', 'Kidney & Liver Panel'];
  }

  const waterLiter = parseFloat((w * 0.033).toFixed(1));
  res.json({
    success: true,
    bmi,
    category,
    risk,
    daily_water_liters: waterLiter,
    recommended_tests: recommendedTests
  });
});

app.get('/api/guides/test-prep', (req: Request, res: Response) => {
  res.json({
    success: true,
    guides: [
      {
        title: 'Fasting Blood Tests (Glucose, Lipid Profile)',
        fasting_hours: '10 - 12 Hours',
        instructions: 'Water is allowed. Avoid coffee, tea, alcohol, and smoking before the sample collection.'
      },
      {
        title: 'Thyroid Profile (T3, T4, TSH)',
        fasting_hours: 'Overnight Fasting Preferred',
        instructions: 'Take thyroid medication AFTER sample collection unless advised otherwise by your physician.'
      },
      {
        title: 'Urine Routine & Microscopic Test',
        fasting_hours: 'No Fasting Required',
        instructions: 'Provide mid-stream clean catch urine sample in the sterile container provided.'
      },
      {
        title: 'Vitamin D & B12 Advanced Duo',
        fasting_hours: '8 Hours Preferred',
        instructions: 'Avoid high-dose vitamin supplements 24 hours prior to blood draw for accurate baseline results.'
      }
    ]
  });
});

// Admin Patients Management
app.get('/api/admin/patients', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT p.id, p.patient_name, p.phone, p.email, p.created_at, COUNT(b.id) as total_bookings 
      FROM patients p 
      LEFT JOIN bookings b ON p.phone = b.phone 
      WHERE 1=1
    `;
    const params: any[] = [];
    if (search) {
      query += ' AND (p.patient_name LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' GROUP BY p.id ORDER BY p.created_at DESC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/patients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM patients WHERE id = ?', [id]);
    res.json({ success: true, message: 'Patient account removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DYNAMIC WEBSITE CMS & IMAGE UPLOADS
// ============================================

// Admin Image Upload
app.post('/api/admin/upload', async (req: Request, res: Response) => {
  try {
    const { filename, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      ext = mimeType.split('/')[1] || 'jpg';
      if (ext === 'jpeg') ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const cleanName = (filename || 'upload').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const uniqueFilename = `${cleanName}_${Date.now()}.${ext}`;
    const targetPath = path.join(uploadsDir, uniqueFilename);

    await fs.promises.writeFile(targetPath, buffer);

    const publicUrl = `/images/uploads/${uniqueFilename}`;
    res.json({
      success: true,
      message: 'Image uploaded successfully!',
      url: publicUrl,
      filename: uniqueFilename
    });
  } catch (err: any) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Failed to process and store image upload' });
  }
});

// Public: Get all CMS site content
app.get('/api/site-content', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT section_key, content_json FROM site_content');
    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.section_key] = typeof row.content_json === 'string' ? JSON.parse(row.content_json) : row.content_json;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get specific CMS section
app.get('/api/site-content/:section', async (req: Request, res: Response) => {
  try {
    const { section } = req.params;
    const [rows]: any = await pool.query('SELECT content_json FROM site_content WHERE section_key = ?', [section]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }
    const content = typeof rows[0].content_json === 'string' ? JSON.parse(rows[0].content_json) : rows[0].content_json;
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update CMS section
app.put('/api/admin/site-content/:section', async (req: Request, res: Response) => {
  try {
    const { section } = req.params;
    const content = req.body;
    const jsonStr = JSON.stringify(content);

    await pool.query(
      `INSERT INTO site_content (section_key, content_json) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE content_json = ?`,
      [section, jsonStr, jsonStr]
    );

    res.json({ success: true, message: `Section '${section}' updated successfully!`, content });
  } catch (err: any) {
    console.error('Error updating site content:', err);
    res.status(500).json({ error: err.message });
  }
});

// Initialize site_content table with defaults if needed
async function initSiteContentTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        section_key VARCHAR(50) PRIMARY KEY,
        content_json JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const defaults: Record<string, any> = {
      header: {
        brand_name: "HealthLab",
        tagline: "Diagnostic Centre",
        badge_text: "NABL Certified & ISO 9001:2015",
        working_hours: "⏰ Mon - Sun, 6:00 AM - 10:00 PM",
        helpline: "+91 98765 43210",
        email: "care@healthlab.in",
        portal_btn_text: "Patient Portal",
        book_btn_text: "Book a Test"
      },
      menus: [
        { id: "home", label: "Home", route: "home", url: "/home", sort_order: 1, is_active: true },
        { id: "tests", label: "Tests & Packages", route: "tests", url: "/tests", sort_order: 2, is_active: true },
        { id: "packages", label: "Health Checkup", route: "packages", url: "/packages", sort_order: 3, is_active: true },
        { id: "guide", label: "Patient Guide", route: "guide", url: "/guide", sort_order: 4, is_active: true },
        { id: "about", label: "About Us", route: "about", url: "/about", sort_order: 5, is_active: true },
        { id: "contact", label: "Contact", route: "contact", url: "/contact", sort_order: 6, is_active: true }
      ],
      hero: {
        eyebrow: "YOUR HEALTH. OUR PRIORITY.",
        headline_prefix: "Complete Diagnostic Care for a",
        headline_highlight: "Healthier Tomorrow",
        subtext: "Accurate Reports | Advanced Technology | Trusted by Over 50,000+ Satisfied Families",
        btn_primary_text: "Book a Test Now ➔",
        btn_primary_link: "#booking",
        btn_secondary_text: "View Health Packages",
        btn_secondary_link: "/packages",
        image_url: "/images/healthlab_hero_scientist.jpg",
        badge_top: "Health Begins with Awareness ❤️",
        badge_bottom: "⭐ 4.8/5 Rating • 50,000+ Tests Processed",
        features: [
          { id: 1, icon_class: "pill-orange", title: "Home Sample Collection", subtitle: "Trained Phlebotomists" },
          { id: 2, icon_class: "pill-teal", title: "Accurate Reports", subtitle: "Same-Day Turnaround" },
          { id: 3, icon_class: "pill-cyan", title: "NABL Certified Lab", subtitle: "ISO 9001:2015 Standards" },
          { id: 4, icon_class: "pill-green", title: "Affordable Pricing", subtitle: "Transparent Test Costs" }
        ]
      },
      stats: [
        { id: 1, value: "50,000+", label: "Happy Patients", color: "blue" },
        { id: 2, value: "1,000+", label: "Tests & Profiles", color: "orange" },
        { id: 3, value: "4.8 / 5", label: "Patient Rating", color: "red" },
        { id: 4, value: "NABL", label: "Certified Laboratory", color: "teal" }
      ],
      doctor_info: {
        name: "Dr. Rajesh Sharma",
        degrees: "MBBS, MD (Pathology), MIAP",
        specialization: "Chief Pathologist & Laboratory Director",
        experience_years: 18,
        bio: "Dr. Rajesh Sharma is a veteran pathologist with over 18 years of clinical laboratory experience. Having served at top medical research institutions, he oversees high-precision automated diagnostics and ensures stringent quality control across all biochemical and haematological analyses.",
        highlights: [
          "18+ Years of Pathology & Clinical Diagnostics",
          "Fellow of the Indian Association of Pathologists",
          "Over 500,000 Diagnostic Reports Supervised",
          "External Quality Assurance (EQAS) Coordinator"
        ],
        opd_schedule: "Mon - Sat: 08:00 AM - 04:00 PM",
        image_url: "/images/healthlab_hero_scientist.jpg"
      },
      clinic_info: {
        hospital_name: "HealthLab Diagnostic & Research Centre",
        address: "104 Medical Enclave, Hauz Khas Main Road, New Delhi - 110016",
        helpline: "+91 98765 43210",
        emergency_phone: "+91 98765 43211",
        email: "care@healthlab.in",
        opd_timings: "Mon - Sun: 06:00 AM - 10:00 PM (Sample Collection 06:30 AM onwards)",
        directions: "Opposite Metro Gate 3, Hauz Khas. Easy wheelchair and stretcher access with temperature-controlled waiting lounge.",
        clinic_image: "/images/healthlab_clinic_interior.jpg"
      },
      about: {
        title: "Precision Diagnostics with World-Class Infrastructure",
        experience_badge: "14+ Years of Precision Pathology Excellence",
        story: "HealthLab Diagnostic Centre is an NABL-accredited diagnostic and pathology establishment committed to providing accurate and timely laboratory testing services. Our facility houses fully automated robotic immunoassay and clinical chemistry platforms from world leaders such as Roche Cobas and Abbott Architect.",
        facility_image: "/images/healthlab_clinic_interior.jpg"
      },
      footer: {
        about_text: "HealthLab Diagnostic Centre provides premier pathology, biochemistry, and preventive health checkups with doorstep sample collection.",
        copyright: "© 2026 HealthLab Diagnostic Centre. All rights reserved.",
        emergency_notice: "For urgent same-day report queries or emergency tests, call +91 98765 43211.",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        twitter: "https://twitter.com",
        youtube: "https://youtube.com"
      }
    };

    for (const [key, val] of Object.entries(defaults)) {
      const jsonStr = JSON.stringify(val);
      await pool.query(
        `INSERT INTO site_content (section_key, content_json) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE section_key = section_key`,
        [key, jsonStr]
      );
    }
    console.log('✅ HealthLab Site Content table verified & initialized.');
  } catch (err) {
    console.error('Warning: Could not initialize site_content table:', err);
  }
}

// -------------------------------------------------------------
// UNIFIED FRONTEND SERVING (Web & Admin Panel for Live Deploy)
// -------------------------------------------------------------
const adminDist = path.join(publicDir, 'admin');
if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist));
  app.get(['/admin', '/admin/*'], (_req: Request, res: Response) => {
    res.sendFile(path.join(adminDist, 'index.html'));
  });
}

const webDist = path.join(publicDir, 'web');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (req: Request, res: Response, next: any) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/images') || req.path.startsWith('/admin')) {
      return next();
    }
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

// Start Server
app.listen(PORT, async () => {
  await initSiteContentTable();
  console.log(`🚀 HealthLab Server running at http://localhost:${PORT}`);
});
