const API_URL = (window.location.port === '3001') ? 'http://localhost:5001/api' : '/api';

// Toast Notification
function showWebToast(msg: string) {
  const t = document.getElementById('web-toast');
  if (!t) return;
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}
(window as any).showWebToast = showWebToast;

// Mobile Nav Toggle
function toggleMobileNav() {
  const navMenu = document.getElementById('navMenu');
  const hamburger = document.getElementById('hamburgerBtn');
  if (navMenu && hamburger) { navMenu.classList.toggle('open'); hamburger.classList.toggle('active'); }
}
(window as any).toggleMobileNav = toggleMobileNav;
function closeMobileNav() {
  const navMenu = document.getElementById('navMenu');
  const hamburger = document.getElementById('hamburgerBtn');
  if (navMenu) navMenu.classList.remove('open');
  if (hamburger) hamburger.classList.remove('active');
}
(window as any).closeMobileNav = closeMobileNav;

// Modal Closing
function closeWebModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
}
(window as any).closeWebModals = closeWebModals;

// ============================================
// CLIENT-SIDE MULTI-PAGE ROUTING
// ============================================
function navigateTo(route: string, pushState = true) {
  if (typeof window !== 'undefined' && (window as any).event) {
    try {
      (window as any).event.preventDefault();
    } catch (_) {}
  }
  const cleanRoute = route.replace('#/', '').replace('#', '').replace('/', '') || 'home';
  if (pushState && window.location.pathname !== `/${cleanRoute}`) {
    history.pushState(null, '', `/${cleanRoute}`);
  }

  // Update nav link active states
  document.querySelectorAll('.nav-links .nav-link').forEach(link => {
    if (link.getAttribute('data-route') === cleanRoute) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
    (link as HTMLElement).blur();
  });

  // Toggle page views
  document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
  const targetView = document.getElementById(`page-${cleanRoute}`);
  if (targetView) {
    targetView.classList.add('active');
  } else {
    document.getElementById('page-home')?.classList.add('active');
  }

  if (cleanRoute === 'portal') {
    initPortalView();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
(window as any).navigateTo = navigateTo;

window.addEventListener('popstate', () => {
  const path = window.location.pathname.replace('/', '') || 'home';
  navigateTo(path, false);
});

// Intercept all local link clicks to prevent hash navigation or full page reload
document.addEventListener('click', (e) => {
  const anchor = (e.target as HTMLElement).closest('a');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (href && (href.startsWith('/') || href.startsWith('#/')) && !href.startsWith('//') && !anchor.getAttribute('target') && !anchor.getAttribute('download')) {
    e.preventDefault();
    const route = href.replace('#/', '').replace('/', '');
    navigateTo(route);
  }
});

// Quick Booking helpers
(window as any).setQuickBooking = () => {
  navigateTo('home');
  setTimeout(() => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};

(window as any).selectPackageForBooking = (pkgName: string) => {
  navigateTo('home');
  setTimeout(() => {
    const select = document.getElementById('booking-test') as HTMLSelectElement;
    if (select) {
      let found = false;
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.includes(pkgName.split(' ')[0])) {
          select.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        const opt = document.createElement('option');
        opt.value = pkgName;
        opt.text = pkgName;
        opt.selected = true;
        select.appendChild(opt);
      }
    }
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};

(window as any).selectServiceForBooking = (serviceName: string) => {
  (window as any).selectPackageForBooking(serviceName);
};

(window as any).selectHomeCollection = () => {
  navigateTo('home');
  setTimeout(() => {
    const radio = document.querySelector<HTMLInputElement>('input[name="visit_type"][value="home_collection"]');
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change'));
    }
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};

// Date picker default
const dateInput = document.getElementById('booking-date') as HTMLInputElement;
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  dateInput.value = today;
}

// Toggle Home Collection Address field
const visitTypeRadios = document.querySelectorAll<HTMLInputElement>('input[name="visit_type"]');
const addressGroup = document.getElementById('address-group');
visitTypeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (addressGroup) {
      addressGroup.style.display = radio.value === 'home_collection' ? 'block' : 'none';
      const addressInput = document.getElementById('patient-address') as HTMLInputElement;
      if (addressInput) addressInput.required = radio.value === 'home_collection';
    }
  });
});

// Home Page Test Booking Form
const bookingForm = document.getElementById('booking-form') as HTMLFormElement;
const modal = document.getElementById('booking-modal');
const modalDetails = document.getElementById('modal-details');

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = bookingForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Submitting Booking...';
    }

    const testOrPackage = (document.getElementById('booking-test') as HTMLSelectElement).value;
    const appointmentDate = (document.getElementById('booking-date') as HTMLInputElement).value;
    const appointmentTime = (document.getElementById('booking-time') as HTMLSelectElement).value;
    const visitType = (document.querySelector('input[name="visit_type"]:checked') as HTMLInputElement)?.value || 'lab_visit';
    const patientName = (document.getElementById('patient-name') as HTMLInputElement).value;
    const patientPhone = (document.getElementById('patient-phone') as HTMLInputElement).value;
    const patientEmail = (document.getElementById('patient-email') as HTMLInputElement).value;
    const patientAddress = (document.getElementById('patient-address') as HTMLInputElement)?.value || '';

    const payload = {
      patient_name: patientName,
      email: patientEmail,
      phone: patientPhone,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      visit_type: visitType,
      test_or_package: testOrPackage,
      address: patientAddress,
      notes: ''
    };

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (modal && modalDetails) {
        modalDetails.innerHTML = `
          <div><strong>Booking Ref:</strong> <span class="code-pill">${data.booking?.booking_code || 'HL-' + Date.now()}</span></div>
          <div><strong>Patient:</strong> ${patientName}</div>
          <div><strong>Test/Package:</strong> ${testOrPackage}</div>
          <div><strong>Date & Slot:</strong> 📅 ${appointmentDate} at ⏰ ${appointmentTime}</div>
          <div><strong>Type:</strong> ${visitType === 'home_collection' ? '🏠 Doorstep Home Collection' : '🏥 Lab Visit (Green Park)'}</div>
          ${patientAddress ? `<div><strong>Address:</strong> ${patientAddress}</div>` : ''}
          <div style="margin-top:12px; color:#166534; font-weight:700;">✨ You can track report findings in the Patient Portal using this Booking Ref!</div>
        `;
        modal.classList.add('open');
      }
      bookingForm.reset();
      showWebToast('Test booking submitted successfully to HealthLab database!');
    } catch (err) {
      showWebToast('Connection error. Please ensure server is running.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Book Now ➔';
      }
    }
  });
}

// Contact Inquiry Form
document.getElementById('contact-inquiry-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: (document.getElementById('inq-name') as HTMLInputElement).value,
    phone: (document.getElementById('inq-phone') as HTMLInputElement).value,
    email: (document.getElementById('inq-email') as HTMLInputElement).value,
    subject: (document.getElementById('inq-subject') as HTMLInputElement).value,
    message: (document.getElementById('inq-message') as HTMLTextAreaElement).value
  };

  try {
    const res = await fetch(`${API_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      (document.getElementById('contact-inquiry-form') as HTMLFormElement).reset();
      showWebToast('Inquiry received! Our pathology desk will reach out.');
    } else {
      showWebToast('Could not submit inquiry. Please try again.');
    }
  } catch (err) {
    showWebToast('Network error while sending inquiry.');
  }
});

// ============================================
// PATIENT PORTAL & DIAGNOSTIC REPORTS CONTROLLER
// ============================================
let currentPatient: any = JSON.parse(localStorage.getItem('healthlab_patient') || 'null');
let currentPortalAppointments: any[] = [];

(window as any).switchPortalAuthTab = (tab: 'login' | 'register') => {
  const loginWrap = document.getElementById('portal-auth-login-wrap');
  const regWrap = document.getElementById('portal-auth-register-wrap');
  const btnLogin = document.getElementById('tab-btn-login');
  const btnReg = document.getElementById('tab-btn-register');

  if (tab === 'login') {
    if (loginWrap) loginWrap.style.display = 'block';
    if (regWrap) regWrap.style.display = 'none';
    btnLogin?.classList.add('active');
    btnReg?.classList.remove('active');
  } else {
    if (loginWrap) loginWrap.style.display = 'none';
    if (regWrap) regWrap.style.display = 'block';
    btnLogin?.classList.remove('active');
    btnReg?.classList.add('active');
  }
};

(window as any).logoutPatient = () => {
  currentPatient = null;
  localStorage.removeItem('healthlab_patient');
  localStorage.removeItem('healthlab_patient_token');
  currentPortalAppointments = [];

  const guestView = document.getElementById('portal-guest-view');
  const userView = document.getElementById('portal-user-view');
  if (guestView) guestView.style.display = 'block';
  if (userView) userView.style.display = 'none';
  showWebToast('Signed out of Patient Portal.');
};

async function initPortalView() {
  if (currentPatient) {
    await fetchAndRenderPatientAppointments();
  }
}

async function fetchAndRenderPatientAppointments() {
  if (!currentPatient) return;
  const token = localStorage.getItem('healthlab_patient_token');
  try {
    const res = await fetch(`${API_URL}/patients/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      currentPortalAppointments = data.appointments || data.bookings || (Array.isArray(data) ? data : []);
      renderPortalUserDashboard(currentPatient.patient_name, currentPatient.phone, currentPortalAppointments, false);
    } else {
      (window as any).logoutPatient();
    }
  } catch (err) {
    showWebToast('Could not load diagnostic records.');
  }
}

function renderPortalUserDashboard(displayName: string, metaInfo: string, appointments: any[], isGuestSearch = false) {
  const guestView = document.getElementById('portal-guest-view');
  const userView = document.getElementById('portal-user-view');
  const userNameEl = document.getElementById('portal-user-name');
  const userMetaEl = document.getElementById('portal-user-meta');
  const countEl = document.getElementById('portal-appt-count');
  const container = document.getElementById('portal-appointments-container');
  const logoutBtn = document.getElementById('btn-portal-logout');

  if (guestView) guestView.style.display = 'none';
  if (userView) userView.style.display = 'block';

  if (userNameEl) userNameEl.innerText = isGuestSearch ? `Diagnostic Records for: ${displayName}` : `Welcome, ${displayName}`;
  if (userMetaEl) userMetaEl.innerText = isGuestSearch ? `Lookup Query: ${metaInfo}` : `Registered Mobile: ${metaInfo}`;
  if (countEl) countEl.innerText = appointments.length.toString();
  if (logoutBtn) logoutBtn.innerText = isGuestSearch ? '← Back to Search' : 'Sign Out / Exit';

  if (!container) return;

  if (appointments.length === 0) {
    container.innerHTML = `
      <div style="background:#fff; border:1px solid #E2E8F0; border-radius:12px; padding:32px; text-align:center; color:#64748B;">
        <p style="font-size:16px; font-weight:700; color:#0F172A; margin-bottom:6px;">No diagnostic reports found for this query.</p>
        <p style="font-size:13.5px; margin-bottom:16px;">Please verify your booking reference code or registered phone.</p>
        <button class="btn-primary" onclick="setQuickBooking()">Book a Test Now</button>
      </div>
    `;
    return;
  }

  container.innerHTML = appointments.map(b => {
    const statusClass = b.status === 'completed' ? 'status-pill-completed' :
                        b.status === 'confirmed' ? 'status-pill-confirmed' : 'status-pill-pending';
    const statusLabel = (b.status || 'pending').replace('_', ' ').toUpperCase();

    const hasDoctorNotes = b.doctor_notes && b.doctor_notes.trim().length > 0;
    const hasResults = b.test_results && b.test_results.trim().length > 0;
    const hasRx = b.doctor_prescription && b.doctor_prescription.trim().length > 0;
    const hasFollowUp = b.follow_up_date && b.follow_up_date.length > 0;

    const formattedDate = b.appointment_date ? (b.appointment_date.includes('T') ? b.appointment_date.split('T')[0] : b.appointment_date) : '';

    return `
      <div class="portal-appt-card">
        <div class="appt-top-bar">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="code-pill">${b.booking_code}</span>
            <span style="font-size:13px; color:#64748B;">${b.visit_type === 'home_collection' ? '🏠 Home Collection' : '🏥 Lab Visit (Green Park)'}</span>
          </div>
          <span class="${statusClass}">${statusLabel}</span>
        </div>

        <div class="appt-patient-row">
          <div>
            <small>Patient Name</small>
            <strong>${b.patient_name}</strong>
          </div>
          <div>
            <small>Test / Package</small>
            <strong>${b.test_or_package}</strong>
          </div>
          <div>
            <small>Appointment Date</small>
            <strong>📅 ${formattedDate}</strong>
          </div>
          <div>
            <small>Time Slot</small>
            <strong>⏰ ${b.appointment_time || '09:00 AM'}</strong>
          </div>
        </div>

        <!-- Pathologist Clinical Findings & Test Parameters -->
        <div class="diagnostic-report-box">
          <div class="diagnostic-report-hdr">
            <span>🔬</span> Pathologist Clinical Assessment & Findings
          </div>
          <div style="font-size:13.5px; color:#1E293B; line-height:1.6;">
            ${hasDoctorNotes ? b.doctor_notes : '<em style="color:#94A3B8;">Sample received in laboratory. Biochemical analysis in progress. Verified findings will appear here shortly.</em>'}
          </div>

          ${hasResults ? `
            <div style="margin-top:12px;">
              <strong style="color:#166534; font-size:13px; display:block; margin-bottom:4px;">📊 Measured Biomarkers & Parameter Breakdown:</strong>
              <div class="lab-parameters-box">${b.test_results}</div>
            </div>
          ` : ''}

          ${hasRx ? `
            <div class="rx-diet-box">
              <strong>🩺 Doctor Prescriptions & Lifestyle Advice:</strong>
              <div class="rx-diet-text">${b.doctor_prescription}</div>
            </div>
          ` : ''}

          ${hasFollowUp ? `
            <div class="followup-strip">
              <span>📅</span> Next Recommended Review: ${b.follow_up_date.includes('T') ? b.follow_up_date.split('T')[0] : b.follow_up_date}
            </div>
          ` : ''}
        </div>

        <div class="appt-card-actions">
          <span style="font-size:12px; color:#94A3B8;">Reporting Pathologist: <strong>Dr. Rajesh Malhotra, MD Pathology</strong></span>
          <button class="btn-print-slip" onclick="openDiagnosticSlip('${b.booking_code}')">
            🖨️ View & Print Diagnostic Report Slip
          </button>
        </div>
      </div>
    `;
  }).join('');
}

(window as any).openDiagnosticSlip = (bookingCode: string) => {
  const b = currentPortalAppointments.find(item => item.booking_code === bookingCode);
  if (!b) return;

  const modalBody = document.getElementById('modal-slip-body');
  if (!modalBody) return;

  const formattedDate = b.appointment_date ? (b.appointment_date.includes('T') ? b.appointment_date.split('T')[0] : b.appointment_date) : '';

  modalBody.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; font-size:13px; background:#F8FAFC; padding:14px; border-radius:8px;">
      <div>
        <p style="margin:0 0 6px;"><strong>Booking Ref:</strong> <span class="code-pill">${b.booking_code}</span></p>
        <p style="margin:0 0 6px;"><strong>Patient:</strong> ${b.patient_name}</p>
        <p style="margin:0;"><strong>Contact:</strong> ${b.phone}</p>
      </div>
      <div>
        <p style="margin:0 0 6px;"><strong>Date & Time:</strong> ${formattedDate} at ${b.appointment_time}</p>
        <p style="margin:0 0 6px;"><strong>Test / Profile:</strong> ${b.test_or_package}</p>
        <p style="margin:0;"><strong>Status:</strong> <span style="text-transform:uppercase; font-weight:800; color:#00897B;">${b.status}</span></p>
      </div>
    </div>

    <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:16px; margin-bottom:16px;">
      <h4 style="font-size:14px; font-weight:800; color:#166534; margin:0 0 6px;">Pathologist Clinical Assessment:</h4>
      <p style="font-size:13.5px; color:#1E293B; line-height:1.6; margin:0;">
        ${b.doctor_notes || 'Testing in progress / Verification pending.'}
      </p>

      ${b.test_results ? `
        <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #BBF7D0;">
          <h4 style="font-size:13.5px; font-weight:800; color:#166534; margin:0 0 6px;">Diagnostic Values:</h4>
          <pre style="white-space:pre-line; font-family:monospace; font-size:12.5px; color:#334155; margin:0; background:#fff; padding:10px; border-radius:6px; border:1px solid #DCFCE7;">${b.test_results}</pre>
        </div>
      ` : ''}

      ${b.doctor_prescription ? `
        <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #BBF7D0;">
          <h4 style="font-size:13.5px; font-weight:800; color:#166534; margin:0 0 6px;">Physician Guidance & Next Steps:</h4>
          <pre style="white-space:pre-line; font-family:inherit; font-size:13px; color:#334155; margin:0;">${b.doctor_prescription}</pre>
        </div>
      ` : ''}
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#64748B; margin-top:16px;">
      <span>NABL Accredited Laboratory No: MC-4921</span>
      <span style="font-weight:700; color:#0F172A;">Authorized Signatory: Dr. Rajesh Malhotra, MD Pathology</span>
    </div>
  `;

  document.getElementById('modal-diagnostic-slip')?.classList.add('open');
};

// Quick Track by Booking Code or Mobile Number Form
document.getElementById('portal-track-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = (document.getElementById('track-query-input') as HTMLInputElement).value.trim();
  if (!query) return;

  try {
    const res = await fetch(`${API_URL}/appointments/track?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (res.ok && data.success) {
      currentPortalAppointments = data.appointments || data.bookings || [];
      renderPortalUserDashboard(query, query, currentPortalAppointments, true);
      showWebToast(`Found ${currentPortalAppointments.length} diagnostic record(s).`);
    } else {
      showWebToast(data.error || 'No matching diagnostic record found.');
    }
  } catch (err) {
    showWebToast('Network error while tracking report.');
  }
});

// Patient Login Form
document.getElementById('portal-login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const identifier = (document.getElementById('login-identifier') as HTMLInputElement).value.trim();
  const password = (document.getElementById('login-password') as HTMLInputElement).value;

  try {
    const res = await fetch(`${API_URL}/patients/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      currentPatient = data.patient;
      localStorage.setItem('healthlab_patient', JSON.stringify(currentPatient));
      localStorage.setItem('healthlab_patient_token', data.token);
      showWebToast(`Welcome back, ${currentPatient.patient_name}!`);
      await fetchAndRenderPatientAppointments();
    } else {
      showWebToast(data.error || 'Login failed. Check credentials.');
    }
  } catch (err) {
    showWebToast('Network error during login.');
  }
});

// Patient Registration Form
document.getElementById('portal-register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const patient_name = (document.getElementById('reg-name') as HTMLInputElement).value.trim();
  const phone = (document.getElementById('reg-phone') as HTMLInputElement).value.trim();
  const email = (document.getElementById('reg-email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('reg-password') as HTMLInputElement).value;

  try {
    const res = await fetch(`${API_URL}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_name, phone, email, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      currentPatient = data.patient;
      localStorage.setItem('healthlab_patient', JSON.stringify(currentPatient));
      localStorage.setItem('healthlab_patient_token', data.token);
      showWebToast(`Account created! Welcome, ${currentPatient.patient_name}!`);
      await fetchAndRenderPatientAppointments();
    } else {
      showWebToast(data.error || 'Registration failed.');
    }
  } catch (err) {
    showWebToast('Network error during registration.');
  }
});

// ============================================
// HEALTH TOOLS & CALCULATORS
// ============================================
async function calculateWebBmi() {
  const weight = (document.getElementById('web-bmi-weight') as HTMLInputElement).value;
  const height = (document.getElementById('web-bmi-height') as HTMLInputElement).value;
  const resultDiv = document.getElementById('web-bmi-result');
  if (!resultDiv) return;

  try {
    const res = await fetch(`${API_URL}/tools/bmi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: weight, height_cm: height })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      resultDiv.innerHTML = `
        <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:14px;">
          <p style="margin:0; font-weight:800; color:#166534; font-size:15px;">Your BMI: ${data.bmi} (${data.category})</p>
          <p style="margin:4px 0 0; font-size:13px; color:#15803D;">Daily Water Target: <strong>${data.daily_water_liters} Liters/day</strong> | Health Risk: ${data.risk}</p>
        </div>
      `;
      return;
    }
  } catch (_) {}

  const w = parseFloat(weight) || 70;
  const h = (parseFloat(height) || 172) / 100;
  const bmi = (w / (h * h)).toFixed(1);
  resultDiv.innerHTML = `
    <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:14px;">
      <p style="margin:0; font-weight:800; color:#166534; font-size:15px;">Your BMI: ${bmi} (Normal Weight)</p>
      <p style="margin:4px 0 0; font-size:13px; color:#15803D;">Daily Water Target: <strong>${(w * 0.033).toFixed(1)} Liters/day</strong></p>
    </div>
  `;
}
(window as any).calculateWebBmi = calculateWebBmi;

// ============================================
// DYNAMIC SITE CONTENT CMS BINDING
// ============================================
async function initSiteContent() {
  try {
    const res = await fetch(`${API_URL}/site-content`);
    if (res.ok) {
      const content = await res.json();
      applyDynamicSiteContent(content);
    }
  } catch (err) {
    console.error('Error loading dynamic site content:', err);
  }
}

function applyDynamicSiteContent(content: any) {
  if (!content) return;

  // 1. Header & Brand
  if (content.header) {
    const h = content.header;
    const badgeEl = document.getElementById('top-bar-badge');
    if (badgeEl && h.badge_text) badgeEl.innerText = h.badge_text;

    const hoursEl = document.getElementById('top-bar-hours');
    if (hoursEl && h.working_hours) hoursEl.innerText = h.working_hours;

    const phoneEl = document.getElementById('top-bar-phone');
    if (phoneEl && h.helpline) phoneEl.innerText = h.helpline;

    const phoneLink = document.getElementById('top-bar-phone-link') as HTMLAnchorElement;
    if (phoneLink && h.helpline) phoneLink.href = `tel:${h.helpline.replace(/[^0-9+]/g, '')}`;

    const brandTitle = document.getElementById('header-brand-title');
    if (brandTitle && h.brand_name) brandTitle.innerText = h.brand_name;

    const brandTagline = document.getElementById('header-brand-tagline');
    if (brandTagline && h.tagline) brandTagline.innerText = h.tagline;

    const portalBtnText = document.getElementById('header-portal-btn-text');
    if (portalBtnText && h.portal_btn_text) portalBtnText.innerText = h.portal_btn_text;

    const bookBtn = document.getElementById('header-book-btn');
    if (bookBtn && h.book_btn_text) bookBtn.innerText = h.book_btn_text;
  }

  // 2. Navigation Menus
  if (Array.isArray(content.menus) && content.menus.length > 0) {
    const sortedMenus = [...content.menus]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .filter(m => m.is_active !== false && m.visible !== false);

    const mainNavList = document.getElementById('main-nav-links-list');
    if (mainNavList && sortedMenus.length > 0) {
      const currentRoute = window.location.pathname.replace('/', '') || 'home';
      mainNavList.innerHTML = sortedMenus.map(m => `
        <li><a href="/${m.route}" data-route="${m.route}" class="nav-link ${currentRoute === m.route ? 'active' : ''}" onclick="navigateTo('${m.route}'); closeMobileNav()">${m.label}</a></li>
      `).join('');
    }

    const footerQuickLinks = document.getElementById('footer-quick-links');
    if (footerQuickLinks && sortedMenus.length > 0) {
      footerQuickLinks.innerHTML = sortedMenus.map(m => `
        <li><a href="/${m.route}" onclick="navigateTo('${m.route}')">${m.label}</a></li>
      `).join('');
    }
  }

  // 3. Hero Section
  if (content.hero) {
    const hr = content.hero;
    const eyebrowEl = document.getElementById('hero-eyebrow-text');
    if (eyebrowEl && hr.eyebrow) eyebrowEl.innerText = hr.eyebrow;

    const headlineEl = document.getElementById('hero-headline-elem');
    const p1 = hr.headline_prefix || 'Complete Diagnostic Care for a';
    const p2 = hr.headline_highlight || 'Healthier Tomorrow';
    if (headlineEl) {
      headlineEl.innerHTML = `${p1} <span class="text-highlight">${p2}</span>`;
    }

    const subtextEl = document.getElementById('hero-subtext-elem');
    if (subtextEl && hr.subtext) subtextEl.innerText = hr.subtext;

    const btnPrimary = document.getElementById('hero-btn-primary');
    if (btnPrimary && hr.btn_primary_text) btnPrimary.innerText = hr.btn_primary_text;

    const btnSecondary = document.getElementById('hero-btn-secondary') as HTMLAnchorElement;
    if (btnSecondary) {
      if (hr.btn_secondary_text) btnSecondary.innerText = hr.btn_secondary_text;
      if (hr.btn_secondary_link) btnSecondary.href = hr.btn_secondary_link;
    }

    const heroImg = document.getElementById('hero-main-img') as HTMLImageElement;
    if (heroImg && hr.image_url) heroImg.src = hr.image_url;

    const quoteText = document.getElementById('hero-quote-text');
    if (quoteText && (hr.badge_top || hr.badge_bottom)) {
      quoteText.innerText = hr.badge_top || hr.badge_bottom;
    }

    if (Array.isArray(hr.features) && hr.features.length > 0) {
      const featList = document.getElementById('hero-features-list');
      if (featList) {
        const icons = ['🏠', '📄', '🛡️', '🔬'];
        featList.innerHTML = hr.features.map((f: any, idx: number) => `
          <div class="pill-item">
            <span class="pill-icon">${icons[idx % icons.length]}</span>
            <span class="pill-text">${f.title || f.text || f}</span>
          </div>
        `).join('');
      }
    }
  }

  // 4. Statistics Counter
  if (Array.isArray(content.stats) && content.stats.length > 0) {
    content.stats.forEach((s: any, idx: number) => {
      const valEl = document.getElementById(`stat-${idx + 1}-val`);
      const lblEl = document.getElementById(`stat-${idx + 1}-lbl`);
      if (valEl && s.value) valEl.innerText = s.value;
      if (lblEl && s.label) lblEl.innerText = s.label;
    });
  }

  // 5. Doctor & Hospital Info
  if (content.doctor_info) {
    const d = content.doctor_info;
    const docImg = document.getElementById('doc-img') as HTMLImageElement;
    if (docImg && d.image_url) docImg.src = d.image_url;

    const docName = document.getElementById('doc-name-text');
    if (docName && d.name) docName.innerText = d.name;

    const docDeg = document.getElementById('doc-degrees-text');
    if (docDeg && d.degrees) docDeg.innerText = d.degrees;

    const docSpec = document.getElementById('doc-spec-text');
    if (docSpec && d.specialization) docSpec.innerText = d.specialization;

    const docExp = document.getElementById('doc-exp-badge');
    if (docExp && d.experience_years) docExp.innerText = `${d.experience_years}+ Years Experience`;

    const docBio = document.getElementById('doc-bio-text');
    if (docBio && d.bio) docBio.innerText = d.bio;

    const docSched = document.getElementById('doc-schedule-text');
    if (docSched && d.opd_schedule) docSched.innerText = d.opd_schedule;

    if (Array.isArray(d.highlights) && d.highlights.length > 0) {
      const hlList = document.getElementById('doc-highlights-list');
      if (hlList) {
        hlList.innerHTML = d.highlights.map((h: string) => `<li>${h}</li>`).join('');
      }
    }
  }

  if (content.clinic_info) {
    const c = content.clinic_info;
    const facImg = document.getElementById('facility-img') as HTMLImageElement;
    if (facImg && c.clinic_image) facImg.src = c.clinic_image;

    const facName = document.getElementById('facility-name-text');
    if (facName && c.hospital_name) facName.innerText = c.hospital_name;

    const facAddr = document.getElementById('facility-address-text');
    if (facAddr && c.address) facAddr.innerText = c.address;

    const facDir = document.getElementById('facility-directions-text');
    if (facDir && c.directions) facDir.innerText = c.directions;

    const facHelp = document.getElementById('facility-helpline-text');
    if (facHelp && c.helpline) facHelp.innerText = c.helpline;

    const facEmerg = document.getElementById('facility-emergency-text');
    if (facEmerg && c.emergency_phone) facEmerg.innerText = c.emergency_phone;

    const facEmail = document.getElementById('facility-email-text');
    if (facEmail && c.email) facEmail.innerText = c.email;

    const facTime = document.getElementById('facility-timings-text');
    if (facTime && c.opd_timings) facTime.innerText = c.opd_timings;
  }

  // 6. About Us & Footer
  if (content.about) {
    const ab = content.about;
    const abTitle = document.getElementById('about-title-text');
    if (abTitle && ab.title) abTitle.innerText = ab.title;

    const abStory = document.getElementById('about-story-text');
    if (abStory && ab.story) abStory.innerText = ab.story;

    const abBadge = document.getElementById('about-badge-val');
    if (abBadge && ab.experience_badge) abBadge.innerText = ab.experience_badge;

    const abImg = document.getElementById('about-facility-img') as HTMLImageElement;
    if (abImg && ab.facility_image) abImg.src = ab.facility_image;
  }

  if (content.footer) {
    const ft = content.footer;
    const ftTitle = document.getElementById('footer-brand-title');
    if (ftTitle && content.header?.brand_name) ftTitle.innerText = `${content.header.brand_name} Diagnostic Centre`;

    const ftAbout = document.getElementById('footer-about-text');
    if (ftAbout && ft.about_text) ftAbout.innerText = ft.about_text;

    const ftCopy = document.getElementById('footer-copyright');
    if (ftCopy && ft.copyright) ftCopy.innerText = ft.copyright;

    const ftNotice = document.getElementById('footer-emergency-notice');
    if (ftNotice && ft.emergency_notice) ftNotice.innerText = ft.emergency_notice;

    const setLink = (id: string, url: string) => {
      const el = document.getElementById(id) as HTMLAnchorElement;
      if (el && url) {
        el.href = url;
        el.target = '_blank';
      }
    };
    if (ft.facebook) setLink('footer-link-fb', ft.facebook);
    if (ft.instagram) setLink('footer-link-ig', ft.instagram);
    if (ft.twitter) setLink('footer-link-tw', ft.twitter);
    if (ft.youtube) setLink('footer-link-yt', ft.youtube);
  }
}

// ============================================
// INITIALIZATION
// ============================================
const initialHash = window.location.hash.replace('#/', '').replace('#', '');
const initialPath = window.location.pathname.replace('/', '');
const startRoute = initialHash || initialPath || 'home';
if (initialHash || window.location.pathname === '/' || window.location.pathname === '') {
  history.replaceState(null, '', `/${startRoute}`);
}
navigateTo(startRoute, false);
initSiteContent();

