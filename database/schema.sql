CREATE DATABASE IF NOT EXISTS healthlab_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE healthlab_db;

-- Admin users table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    patient_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    visit_type VARCHAR(50) DEFAULT 'lab_visit',
    test_or_package VARCHAR(150) NOT NULL,
    address TEXT,
    notes TEXT,
    doctor_notes TEXT,
    test_results TEXT,
    doctor_prescription TEXT,
    follow_up_date DATE,
    status ENUM('pending', 'confirmed', 'sample_collected', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registered patients table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diagnostic services
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Popular health packages
CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tagline VARCHAR(150),
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    tests_included INT DEFAULT 1,
    features JSON,
    badge VARCHAR(50),
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Health tips & articles
CREATE TABLE IF NOT EXISTS articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'Diagnostic Health',
    publish_date DATE NOT NULL,
    image_url VARCHAR(255),
    excerpt TEXT,
    content TEXT,
    author VARCHAR(100) DEFAULT 'HealthLab Team',
    is_published BOOLEAN DEFAULT TRUE
);

-- Patient testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    rating INT DEFAULT 5,
    comment TEXT NOT NULL,
    avatar_url VARCHAR(255),
    is_featured BOOLEAN DEFAULT TRUE
);

-- Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(150),
    message TEXT NOT NULL,
    status ENUM('new', 'in_progress', 'resolved') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial data
INSERT INTO admins (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@healthlab.in', '$2a$10$w09ZkF1zG29yY0YyX0X6l.uF4F7v3yVb2w9r1j8zP5t7c6s4u1e9u', 'HealthLab Director', 'superadmin')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO services (name, category, description, price, icon) VALUES
('Blood Tests', 'Pathology', 'Complete blood count, ESR, and routine haematology profiles', 450.00, 'blood'),
('Urine Tests', 'Routine', 'Routine microscopic and advanced chemical urine analysis', 350.00, 'urine'),
('Stool Tests', 'Gastroenterology', 'Infection, parasitic, and digestive health screening', 400.00, 'stool'),
('Hormone Tests', 'Endocrinology', 'Comprehensive thyroid, fertility, and reproductive hormones', 1200.00, 'hormone'),
('Vitamin & Mineral Tests', 'Nutrition', 'Vitamin D, B12, Calcium, and essential mineral panel', 1100.00, 'vitamin'),
('Liver Function Tests', 'Biochemistry', 'Assess liver enzymes, SGOT, SGPT, and bilirubin health', 750.00, 'liver'),
('Kidney Function Tests', 'Renal', 'Serum creatinine, blood urea nitrogen, electrolytes check', 750.00, 'kidney'),
('Heart Health Tests', 'Cardiology', 'Cholesterol, lipid profile, and cardiac markers check', 850.00, 'heart'),
('Diabetes Tests', 'Metabolic', 'HbA1c, fasting & post-prandial blood glucose checks', 500.00, 'diabetes'),
('Cancer Markers', 'Oncology', 'PSA, CA-125, CEA and early tumor marker detection', 2200.00, 'cancer')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO packages (name, tagline, description, price, original_price, tests_included, badge, is_popular) VALUES
('Basic Health Checkup', 'Essential tests for your routine health', 'Includes CBC, Blood Sugar, Routine Urine, and Lipid Screen', 699.00, 1200.00, 24, 'Basic', 0),
('Executive Health Checkup', 'A complete health assessment', 'Comprehensive coverage of liver, renal, thyroid, and cardiac health', 1499.00, 2800.00, 58, 'Popular', 1),
('Diabetic Care Package', 'Monitor & manage your health', 'Specialized panel for diabetic management with HbA1c, kidney panel', 899.00, 1600.00, 32, 'Specialized', 0),
('Full Body Checkup', 'Comprehensive testing for total wellness', 'Complete master health package with vitamins, hormones, and all vital organs', 2499.00, 4500.00, 84, 'Recommended', 1)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO articles (title, slug, publish_date, image_url, excerpt) VALUES
('10 Essential Tests Everyone Should Do Once a Year', '10-essential-tests-yearly', '2026-09-12', '/images/healthlab_blog_nutrition.png', 'Preventative healthcare saves lives. Learn which routine screening tests provide the clearest picture of your overall vitality.'),
('How to Keep Your Heart Healthy Naturally', 'how-to-keep-heart-healthy', '2026-09-08', '/images/healthlab_blog_heart.png', 'Explore cardiovascular health guidelines, optimal lipid targets, and nutrition habits that strengthen your heart muscle.'),
('The Importance of Vitamin D for a Stronger You', 'importance-of-vitamin-d', '2026-09-05', '/images/healthlab_blog_vitamind.png', 'Over 70% of individuals are deficient in Vitamin D. Discover how adequate levels boost immunity, bone density, and mood.')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO testimonials (patient_name, location, rating, comment, avatar_url) VALUES
('Priya Sharma', 'Green Park, New Delhi', 5, 'Very professional and prompt service. Home collection was so convenient and painless!', '/images/testimonials/avatar1.png'),
('Amit Verma', 'Gurugram', 5, 'Reports are accurate and delivered on time. Highly recommended for complete diagnostic care.', '/images/testimonials/avatar2.png'),
('Neha Singh', 'Noida', 5, 'Friendly staff and clean facilities. Great experience with my executive checkup.', '/images/testimonials/avatar3.png')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO bookings (booking_code, patient_name, email, phone, appointment_date, appointment_time, visit_type, test_or_package, address, status) VALUES
('HL-2026-001', 'Rajesh Gupta', 'rajesh.g@example.com', '+91 98111 22334', '2026-09-20', '08:30 AM', 'home_collection', 'Full Body Checkup', 'Flat 402, Sunshine Apts, New Delhi', 'confirmed'),
('HL-2026-002', 'Sunita Rao', 'sunita.rao@example.com', '+91 98222 33445', '2026-09-20', '10:00 AM', 'lab_visit', 'Executive Health Checkup', '', 'pending'),
('HL-2026-003', 'Vikram Malhotra', 'vikram.m@example.com', '+91 98333 44556', '2026-09-21', '09:00 AM', 'lab_visit', 'Blood Tests', '', 'confirmed')
ON DUPLICATE KEY UPDATE id=id;

-- Site dynamic content CMS table
CREATE TABLE IF NOT EXISTS site_content (
    section_key VARCHAR(50) PRIMARY KEY,
    content_json JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO site_content (section_key, content_json) VALUES
('header', '{
    "brand_name": "HealthLab",
    "tagline": "Diagnostic Centre",
    "badge_text": "NABL Certified & ISO 9001:2015",
    "working_hours": "⏰ Mon - Sun, 6:00 AM - 10:00 PM",
    "helpline": "+91 98765 43210",
    "email": "care@healthlab.in",
    "portal_btn_text": "Patient Portal",
    "book_btn_text": "Book a Test"
}'),
('menus', '[
    {"id": "home", "label": "Home", "route": "home", "url": "/home", "sort_order": 1, "is_active": true},
    {"id": "tests", "label": "Tests & Packages", "route": "tests", "url": "/tests", "sort_order": 2, "is_active": true},
    {"id": "packages", "label": "Health Checkup", "route": "packages", "url": "/packages", "sort_order": 3, "is_active": true},
    {"id": "guide", "label": "Patient Guide", "route": "guide", "url": "/guide", "sort_order": 4, "is_active": true},
    {"id": "about", "label": "About Us", "route": "about", "url": "/about", "sort_order": 5, "is_active": true},
    {"id": "contact", "label": "Contact", "route": "contact", "url": "/contact", "sort_order": 6, "is_active": true}
]'),
('hero', '{
    "eyebrow": "YOUR HEALTH. OUR PRIORITY.",
    "headline_prefix": "Complete Diagnostic Care for a",
    "headline_highlight": "Healthier Tomorrow",
    "subtext": "Accurate Reports | Advanced Technology | Trusted by Over 50,000+ Satisfied Families",
    "btn_primary_text": "Book a Test Now ➔",
    "btn_primary_link": "#booking",
    "btn_secondary_text": "View Health Packages",
    "btn_secondary_link": "/packages",
    "image_url": "/images/healthlab_hero_scientist.jpg",
    "badge_top": "Health Begins with Awareness ❤️",
    "badge_bottom": "⭐ 4.8/5 Rating • 50,000+ Tests Processed",
    "features": [
        {"id": 1, "icon_class": "pill-orange", "title": "Home Sample Collection", "subtitle": "Trained Phlebotomists"},
        {"id": 2, "icon_class": "pill-teal", "title": "Accurate Reports", "subtitle": "Same-Day Turnaround"},
        {"id": 3, "icon_class": "pill-cyan", "title": "NABL Certified Lab", "subtitle": "ISO 9001:2015 Standards"},
        {"id": 4, "icon_class": "pill-green", "title": "Affordable Pricing", "subtitle": "Transparent Test Costs"}
    ]
}'),
('stats', '[
    {"id": 1, "value": "50,000+", "label": "Happy Patients", "color": "blue"},
    {"id": 2, "value": "1,000+", "label": "Tests & Profiles", "color": "orange"},
    {"id": 3, "value": "4.8 / 5", "label": "Patient Rating", "color": "red"},
    {"id": 4, "value": "NABL", "label": "Certified Laboratory", "color": "teal"}
]'),
('doctor_info', '{
    "name": "Dr. Rajesh Sharma",
    "degrees": "MBBS, MD (Pathology), MIAP",
    "specialization": "Chief Pathologist & Laboratory Director",
    "experience_years": 18,
    "bio": "Dr. Rajesh Sharma is a veteran pathologist with over 18 years of clinical laboratory experience. Having served at top medical research institutions, he oversees high-precision automated diagnostics and ensures stringent quality control across all biochemical and haematological analyses.",
    "highlights": [
        "18+ Years of Pathology & Clinical Diagnostics",
        "Fellow of the Indian Association of Pathologists",
        "Over 500,000 Diagnostic Reports Supervised",
        "External Quality Assurance (EQAS) Coordinator"
    ],
    "opd_schedule": "Mon - Sat: 08:00 AM - 04:00 PM",
    "image_url": "/images/healthlab_hero_scientist.jpg"
}'),
('clinic_info', '{
    "hospital_name": "HealthLab Diagnostic & Research Centre",
    "address": "104 Medical Enclave, Hauz Khas Main Road, New Delhi - 110016",
    "helpline": "+91 98765 43210",
    "emergency_phone": "+91 98765 43211",
    "email": "care@healthlab.in",
    "opd_timings": "Mon - Sun: 06:00 AM - 10:00 PM (Sample Collection 06:30 AM onwards)",
    "directions": "Opposite Metro Gate 3, Hauz Khas. Easy wheelchair and stretcher access with temperature-controlled waiting lounge.",
    "clinic_image": "/images/healthlab_clinic_interior.jpg"
}'),
('about', '{
    "title": "Precision Diagnostics with World-Class Infrastructure",
    "experience_badge": "14+ Years of Precision Pathology Excellence",
    "story": "HealthLab Diagnostic Centre is an NABL-accredited diagnostic and pathology establishment committed to providing accurate and timely laboratory testing services. Our facility houses fully automated robotic immunoassay and clinical chemistry platforms from world leaders such as Roche Cobas and Abbott Architect.",
    "facility_image": "/images/healthlab_clinic_interior.jpg"
}'),
('footer', '{
    "about_text": "HealthLab Diagnostic Centre provides premier pathology, biochemistry, and preventive health checkups with doorstep sample collection.",
    "copyright": "© 2026 HealthLab Diagnostic Centre. All rights reserved.",
    "emergency_notice": "For urgent same-day report queries or emergency tests, call +91 98765 43211.",
    "facebook": "https://facebook.com",
    "instagram": "https://instagram.com",
    "twitter": "https://twitter.com",
    "youtube": "https://youtube.com"
}')
ON DUPLICATE KEY UPDATE content_json=VALUES(content_json);
