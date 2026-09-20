const API_BASE = (window.location.port === '4001') ? 'http://localhost:5001/api' : '/api';

interface Booking {
  id: number;
  booking_code: string;
  patient_name: string;
  email: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
  test_or_package: string;
  address: string;
  notes: string;
  doctor_notes?: string;
  test_results?: string;
  doctor_prescription?: string;
  follow_up_date?: string;
  status: string;
  created_at: string;
}

let allBookings: Booking[] = [];
let currentFilter = 'all';

// Fetch Dashboard Stats
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    const data = await res.json();
    (document.getElementById('stat-total') as HTMLElement).innerText = data.total || 0;
    (document.getElementById('stat-pending') as HTMLElement).innerText = data.pending || 0;
    (document.getElementById('stat-confirmed') as HTMLElement).innerText = data.confirmed || 0;
    (document.getElementById('stat-completed') as HTMLElement).innerText = data.completed || 0;
    (document.getElementById('pending-badge') as HTMLElement).innerText = data.pending || 0;
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

// Fetch All Bookings
async function loadBookings() {
  try {
    const res = await fetch(`${API_BASE}/admin/bookings`);
    allBookings = await res.json();
    renderBookingsTable();
  } catch (e) {
    console.error('Failed to load bookings:', e);
    const tbody = document.getElementById('bookings-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4" style="color:#EF4444;">Error connecting to MySQL server at http://localhost:5001. Please ensure server is running.</td></tr>`;
    }
  }
}

// Render Table
function renderBookingsTable() {
  const tbody = document.getElementById('bookings-tbody');
  const search = (document.getElementById('table-search') as HTMLInputElement)?.value.toLowerCase() || '';
  if (!tbody) return;

  const filtered = allBookings.filter(b => {
    const matchesStatus = currentFilter === 'all' || b.status === currentFilter;
    const matchesSearch = !search ||
      b.patient_name.toLowerCase().includes(search) ||
      b.phone.toLowerCase().includes(search) ||
      b.booking_code.toLowerCase().includes(search) ||
      b.test_or_package.toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">No matching booking records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const formattedDate = new Date(b.appointment_date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `
      <tr>
        <td><span class="booking-ref">${b.booking_code}</span></td>
        <td class="patient-cell">
          <strong>${b.patient_name}</strong>
          <small>📞 ${b.phone} ${b.email ? `| ✉️ ${b.email}` : ''}</small>
        </td>
        <td><strong>${b.test_or_package}</strong></td>
        <td>
          <div>📅 ${formattedDate}</div>
          <small style="color:#64748B;">⏰ ${b.appointment_time}</small>
        </td>
        <td>
          <span style="font-size:12px;">${b.visit_type === 'home_collection' ? '🏠 Home Pickup' : '🏥 Lab Walk-in'}</span>
        </td>
        <td>
          <span class="status-pill status-${b.status}">${b.status}</span>
        </td>
        <td style="display:flex; gap:6px; align-items:center;">
          <button class="btn-notes-rx" onclick="openNotesModal(${b.id})" title="Enter Pathologist Findings & Advice">🩺 Report & Rx</button>
          <select class="status-select" onchange="updateBookingStatus(${b.id}, this.value)">
            <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="sample_collected" ${b.status === 'sample_collected' ? 'selected' : ''}>Sample Collected</option>
            <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <button class="btn-del" onclick="deleteBooking(${b.id})" title="Delete">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Open Pathologist Findings & Clinical Advice Modal
(window as any).openNotesModal = (id: number) => {
  const b = allBookings.find(item => item.id === id);
  if (!b) return;

  (document.getElementById('notes-booking-id') as HTMLInputElement).value = b.id.toString();
  const meta = document.getElementById('doc-notes-patient-meta');
  if (meta) meta.innerText = `Patient: ${b.patient_name} | Ref: ${b.booking_code} (${b.test_or_package})`;

  (document.getElementById('notes-doctor-observations') as HTMLTextAreaElement).value = b.doctor_notes || '';
  (document.getElementById('notes-test-results') as HTMLTextAreaElement).value = b.test_results || '';
  (document.getElementById('notes-doctor-prescription') as HTMLTextAreaElement).value = b.doctor_prescription || '';
  (document.getElementById('notes-followup-date') as HTMLInputElement).value = b.follow_up_date ? b.follow_up_date.split('T')[0] : '';
  (document.getElementById('notes-status-select') as HTMLSelectElement).value = b.status || 'completed';

  document.getElementById('modal-doctor-notes')?.classList.add('open');
};

// Close Notes Modal
document.getElementById('btn-close-notes-modal')?.addEventListener('click', () => {
  document.getElementById('modal-doctor-notes')?.classList.remove('open');
});
document.getElementById('btn-cancel-notes-modal')?.addEventListener('click', () => {
  document.getElementById('modal-doctor-notes')?.classList.remove('open');
});

// Submit Notes & Test Results
document.getElementById('doctor-notes-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = (document.getElementById('notes-booking-id') as HTMLInputElement).value;
  const payload = {
    doctor_notes: (document.getElementById('notes-doctor-observations') as HTMLTextAreaElement).value,
    test_results: (document.getElementById('notes-test-results') as HTMLTextAreaElement).value,
    doctor_prescription: (document.getElementById('notes-doctor-prescription') as HTMLTextAreaElement).value,
    follow_up_date: (document.getElementById('notes-followup-date') as HTMLInputElement).value || null,
    status: (document.getElementById('notes-status-select') as HTMLSelectElement).value
  };

  try {
    const res = await fetch(`${API_BASE}/admin/bookings/${id}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      document.getElementById('modal-doctor-notes')?.classList.remove('open');
      await loadStats();
      await loadBookings();
    } else {
      alert('Failed to save clinical advice and test results to MySQL.');
    }
  } catch (err) {
    alert('Network error while saving notes.');
  }
});

// Update Status in MySQL
(window as any).updateBookingStatus = async (id: number, status: string) => {
  try {
    const res = await fetch(`${API_BASE}/admin/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      await loadStats();
      await loadBookings();
    }
  } catch (err) {
    alert('Failed to update status in database');
  }
};

// Delete Booking
(window as any).deleteBooking = async (id: number) => {
  if (!confirm('Are you sure you want to delete this booking record from MySQL?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadStats();
      await loadBookings();
    }
  } catch (err) {
    alert('Failed to delete booking');
  }
};

// Fetch Services & Packages lists
async function loadLists() {
  try {
    const [sRes, pRes] = await Promise.all([
      fetch(`${API_BASE}/services`),
      fetch(`${API_BASE}/packages`)
    ]);
    const services = await sRes.json();
    const packages = await pRes.json();

    const sContainer = document.getElementById('services-list');
    if (sContainer && Array.isArray(services)) {
      sContainer.innerHTML = services.map((s: any) => `
        <div class="list-item">
          <div>
            <strong>${s.name}</strong>
            <small style="color:#64748B; display:block;">${s.category}</small>
          </div>
          <span>₹${s.price}</span>
        </div>
      `).join('');
    }

    const pContainer = document.getElementById('packages-list');
    if (pContainer && Array.isArray(packages)) {
      pContainer.innerHTML = packages.map((p: any) => `
        <div class="list-item">
          <div>
            <strong>${p.name}</strong>
            <small style="color:#64748B; display:block;">${p.tests_included || 20}+ Tests Included</small>
          </div>
          <span>₹${p.price}</span>
        </div>
      `).join('');
    }
  } catch (e) {
    console.warn('Could not load services/packages list');
  }
}

// Modal handling
const modal = document.getElementById('create-modal');
const btnOpen = document.getElementById('btn-open-create-modal');
const btnClose = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel-modal');
const createForm = document.getElementById('create-booking-form') as HTMLFormElement;

btnOpen?.addEventListener('click', () => {
  const dateField = document.getElementById('new-date') as HTMLInputElement;
  if (dateField) dateField.value = new Date().toISOString().split('T')[0];
  modal?.classList.add('open');
});

btnClose?.addEventListener('click', () => modal?.classList.remove('open'));
btnCancel?.addEventListener('click', () => modal?.classList.remove('open'));

createForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    patient_name: (document.getElementById('new-name') as HTMLInputElement).value,
    phone: (document.getElementById('new-phone') as HTMLInputElement).value,
    email: (document.getElementById('new-email') as HTMLInputElement).value,
    test_or_package: (document.getElementById('new-test') as HTMLSelectElement).value,
    appointment_date: (document.getElementById('new-date') as HTMLInputElement).value,
    appointment_time: (document.getElementById('new-time') as HTMLInputElement).value,
    visit_type: (document.getElementById('new-visit-type') as HTMLSelectElement).value,
    status: (document.getElementById('new-status') as HTMLSelectElement).value,
    address: (document.getElementById('new-address') as HTMLInputElement).value,
    notes: 'Created by Admin staff'
  };

  try {
    const res = await fetch(`${API_BASE}/admin/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      modal?.classList.remove('open');
      createForm.reset();
      await loadStats();
      await loadBookings();
    }
  } catch (err) {
    alert('Error saving new booking to MySQL');
  }
});

// Filter tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.getAttribute('data-status') || 'all';
    renderBookingsTable();
  });
});

// Search
document.getElementById('table-search')?.addEventListener('input', () => {
  renderBookingsTable();
});

interface PatientAccount {
  id: number;
  patient_name: string;
  phone: string;
  email: string;
  created_at: string;
  total_bookings: number;
}

let allPatients: PatientAccount[] = [];

// ============================================
// ADMIN AUTHENTICATION & SECURITY
// ============================================
function checkAdminAuth() {
  const token = localStorage.getItem('healthlab_admin_token');
  const overlay = document.getElementById('admin-auth-overlay');
  if (!token) {
    if (overlay) overlay.style.display = 'flex';
  } else {
    if (overlay) overlay.style.display = 'none';
    const adminObj = JSON.parse(localStorage.getItem('healthlab_admin_user') || '{}');
    const nameLabel = document.getElementById('admin-display-name');
    if (nameLabel && adminObj.full_name) {
      nameLabel.innerText = adminObj.full_name;
    }
  }
}

document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = (document.getElementById('admin-user-input') as HTMLInputElement).value.trim();
  const password = (document.getElementById('admin-pass-input') as HTMLInputElement).value;
  const errDiv = document.getElementById('admin-auth-error');

  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.setItem('healthlab_admin_token', data.token);
      localStorage.setItem('healthlab_admin_user', JSON.stringify(data.admin || { full_name: 'HealthLab Director' }));
      if (errDiv) errDiv.style.display = 'none';
      checkAdminAuth();
      initDashboardData();
    } else {
      if (errDiv) {
        errDiv.innerText = data.error || 'Invalid admin credentials.';
        errDiv.style.display = 'block';
      }
    }
  } catch (err) {
    if (errDiv) {
      errDiv.innerText = 'Network error verifying admin credentials.';
      errDiv.style.display = 'block';
    }
  }
});

function logoutAdminSession() {
  localStorage.removeItem('healthlab_admin_token');
  localStorage.removeItem('healthlab_admin_user');
  checkAdminAuth();
}
(window as any).logoutAdminSession = logoutAdminSession;

// ============================================
// REGISTERED PATIENTS MANAGEMENT
// ============================================
async function loadPatients() {
  try {
    const token = localStorage.getItem('healthlab_admin_token');
    const res = await fetch(`${API_BASE}/admin/patients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      allPatients = await res.json();
      renderPatientsTable();
    }
  } catch (e) {
    console.error('Failed to load patients:', e);
  }
}

function renderPatientsTable() {
  const tbody = document.getElementById('patients-tbody');
  const badge = document.getElementById('patients-badge');
  const searchInput = (document.getElementById('patient-search-input') as HTMLInputElement)?.value.toLowerCase() || '';

  if (badge) badge.innerText = allPatients.length.toString();
  if (!tbody) return;

  const filtered = allPatients.filter(p => {
    return !searchInput ||
      (p.patient_name && p.patient_name.toLowerCase().includes(searchInput)) ||
      (p.phone && p.phone.toLowerCase().includes(searchInput)) ||
      (p.email && p.email.toLowerCase().includes(searchInput));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">No registered patient user accounts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const createdDate = p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
    return `
      <tr>
        <td><strong>#P-${p.id}</strong></td>
        <td><strong>${p.patient_name || 'Anonymous User'}</strong></td>
        <td>📞 ${p.phone}</td>
        <td>✉️ ${p.email || 'N/A'}</td>
        <td>📅 ${createdDate}</td>
        <td><span style="background:#E0F2FE; color:#0284C7; font-weight:700; padding:2px 8px; border-radius:12px;">${p.total_bookings} Bookings</span></td>
        <td class="text-right">
          <button class="btn-action-sm btn-delete" onclick="deletePatientUser(${p.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

(window as any).filterPatientsTable = renderPatientsTable;

(window as any).deletePatientUser = async (id: number) => {
  if (!confirm('Are you sure you want to remove this registered patient user account?')) return;
  try {
    const token = localStorage.getItem('healthlab_admin_token');
    const res = await fetch(`${API_BASE}/admin/patients/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      await loadPatients();
    }
  } catch (err) {
    alert('Failed to delete patient account.');
  }
};

document.getElementById('patient-search-input')?.addEventListener('input', renderPatientsTable);

// Toast Helper
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  let t = document.getElementById('admin-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'admin-toast';
    t.className = 'toast-msg';
    document.body.appendChild(t);
  }
  t.innerText = msg;
  t.className = `toast-msg ${type} show`;
  setTimeout(() => t?.classList.remove('show'), 3500);
}

// Modal helper
(window as any).closeModals = () => {
  document.querySelectorAll('.modal, .admin-modal').forEach(m => m.classList.remove('open'));
};
document.getElementById('btn-close-menu-modal')?.addEventListener('click', () => (window as any).closeModals());
document.getElementById('btn-cancel-menu-modal')?.addEventListener('click', () => (window as any).closeModals());

// ============================================
// CMS STATE & HANDLERS
// ============================================
let allMenus: any[] = [];
let currentHeroContent: any = {};

// Image Upload Handler
async function handleCmsImageUpload(fileInput: HTMLInputElement, targetInputId: string, previewImgId?: string) {
  if (!fileInput.files || !fileInput.files[0]) return;
  const file = fileInput.files[0];
  const previewEl = previewImgId ? document.getElementById(previewImgId) as HTMLImageElement : null;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target?.result as string;
    if (previewEl) previewEl.src = base64Data;

    try {
      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, base64Data })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const targetInput = document.getElementById(targetInputId) as HTMLInputElement;
        if (targetInput) targetInput.value = data.url;
        if (previewEl) previewEl.src = data.url;
        showToast('Image uploaded and preview updated!');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast('Error uploading image to server', 'error');
    }
  };
  reader.readAsDataURL(file);
}
(window as any).handleCmsImageUpload = handleCmsImageUpload;

// 1. Header & Navigation Menus
async function loadHeaderMenus() {
  try {
    const [hdrRes, menuRes] = await Promise.all([
      fetch(`${API_BASE}/site-content/header`),
      fetch(`${API_BASE}/site-content/menus`)
    ]);

    const hdr = await hdrRes.json();
    if (hdr) {
      const setVal = (id: string, v: string) => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) el.value = v || '';
      };
      setVal('hdr-brand-name', hdr.brand_name || 'HealthLab');
      setVal('hdr-tagline', hdr.tagline || '');
      setVal('hdr-badge-text', hdr.badge_text || '');
      setVal('hdr-working-hours', hdr.working_hours || '');
      setVal('hdr-helpline', hdr.helpline || '');
      setVal('hdr-email', hdr.email || '');
      setVal('hdr-portal-btn', hdr.portal_btn_text || 'Patient Portal');
      setVal('hdr-book-btn', hdr.book_btn_text || 'Book Test Now');
    }

    allMenus = await menuRes.json();
    if (Array.isArray(allMenus)) {
      renderMenusTable();
    }
  } catch (err) {
    console.error('Error loading header & menus CMS:', err);
  }
}

function renderMenusTable() {
  const tbody = document.getElementById('menus-tbody');
  if (!tbody) return;

  if (!allMenus || allMenus.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4" style="color:#64748B;">No menu links configured. Click "+ Add Menu Link" to create one.</td></tr>`;
    return;
  }

  allMenus.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  tbody.innerHTML = allMenus.map((item, index) => `
    <tr>
      <td><span class="code-pill">${item.sort_order || index + 1}</span></td>
      <td><strong>${item.label}</strong></td>
      <td><code>${item.route}</code></td>
      <td><span style="color: #64748B;">${item.url}</span></td>
      <td>
        <button class="btn-toggle ${item.is_active ? 'active' : 'inactive'}" onclick="toggleMenuVisibility('${item.id}')">
          ${item.is_active ? 'Visible' : 'Hidden'}
        </button>
      </td>
      <td>
        <button class="btn-move" onclick="moveMenuItem('${item.id}', -1)" title="Move Up">▲</button>
        <button class="btn-move" onclick="moveMenuItem('${item.id}', 1)" title="Move Down">▼</button>
        <button class="btn-edit" onclick="openEditMenuModal('${item.id}')">Edit</button>
        <button class="btn-trash" onclick="deleteMenuItem('${item.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openNewMenuModal() {
  const titleEl = document.getElementById('modal-menu-title');
  if (titleEl) titleEl.innerText = '+ Add Navigation Menu Item';
  (document.getElementById('menu-item-id') as HTMLInputElement).value = '';
  (document.getElementById('menu-item-label') as HTMLInputElement).value = '';
  (document.getElementById('menu-item-route') as HTMLInputElement).value = '';
  (document.getElementById('menu-item-url') as HTMLInputElement).value = '';
  (document.getElementById('menu-item-order') as HTMLInputElement).value = String((allMenus ? allMenus.length : 0) + 1);
  (document.getElementById('menu-item-active') as HTMLInputElement).checked = true;
  document.getElementById('modal-menu-item')?.classList.add('open');
}
(window as any).openNewMenuModal = openNewMenuModal;

function openEditMenuModal(id: string) {
  const item = allMenus.find(m => String(m.id) === String(id));
  if (!item) return;

  const titleEl = document.getElementById('modal-menu-title');
  if (titleEl) titleEl.innerText = 'Edit Navigation Menu Item';
  (document.getElementById('menu-item-id') as HTMLInputElement).value = item.id;
  (document.getElementById('menu-item-label') as HTMLInputElement).value = item.label;
  (document.getElementById('menu-item-route') as HTMLInputElement).value = item.route;
  (document.getElementById('menu-item-url') as HTMLInputElement).value = item.url;
  (document.getElementById('menu-item-order') as HTMLInputElement).value = String(item.sort_order || 1);
  (document.getElementById('menu-item-active') as HTMLInputElement).checked = item.is_active !== false;
  document.getElementById('modal-menu-item')?.classList.add('open');
}
(window as any).openEditMenuModal = openEditMenuModal;

async function saveMenuItem(e: Event) {
  e.preventDefault();
  const id = (document.getElementById('menu-item-id') as HTMLInputElement).value;
  const label = (document.getElementById('menu-item-label') as HTMLInputElement).value;
  const route = (document.getElementById('menu-item-route') as HTMLInputElement).value.trim().toLowerCase();
  const url = (document.getElementById('menu-item-url') as HTMLInputElement).value.trim();
  const sort_order = parseInt((document.getElementById('menu-item-order') as HTMLInputElement).value) || 1;
  const is_active = (document.getElementById('menu-item-active') as HTMLInputElement).checked;

  if (id) {
    const idx = allMenus.findIndex(m => String(m.id) === String(id));
    if (idx !== -1) {
      allMenus[idx] = { id, label, route, url, sort_order, is_active };
    }
  } else {
    const newId = route || 'menu_' + Date.now();
    allMenus.push({ id: newId, label, route, url, sort_order, is_active });
  }

  await syncMenusToDatabase();
  (window as any).closeModals();
  showToast('Navigation menu updated successfully!');
  renderMenusTable();
}

async function deleteMenuItem(id: string) {
  if (!confirm('Are you sure you want to remove this navigation link?')) return;
  allMenus = allMenus.filter(m => String(m.id) !== String(id));
  await syncMenusToDatabase();
  showToast('Menu item removed!');
  renderMenusTable();
}
(window as any).deleteMenuItem = deleteMenuItem;

async function toggleMenuVisibility(id: string) {
  const item = allMenus.find(m => String(m.id) === String(id));
  if (item) {
    item.is_active = !item.is_active;
    await syncMenusToDatabase();
    showToast(`Menu link is now ${item.is_active ? 'Visible' : 'Hidden'} on website!`);
    renderMenusTable();
  }
}
(window as any).toggleMenuVisibility = toggleMenuVisibility;

async function moveMenuItem(id: string, direction: number) {
  allMenus.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const idx = allMenus.findIndex(m => String(m.id) === String(id));
  if (idx === -1) return;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= allMenus.length) return;

  const tempOrder = allMenus[idx].sort_order;
  allMenus[idx].sort_order = allMenus[targetIdx].sort_order;
  allMenus[targetIdx].sort_order = tempOrder;

  await syncMenusToDatabase();
  renderMenusTable();
}
(window as any).moveMenuItem = moveMenuItem;

async function syncMenusToDatabase() {
  try {
    await fetch(`${API_BASE}/admin/site-content/menus`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allMenus)
    });
  } catch (err) {
    console.error('Error saving menus to DB:', err);
  }
}

document.getElementById('menu-item-form')?.addEventListener('submit', saveMenuItem);

document.getElementById('header-cms-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    brand_name: (document.getElementById('hdr-brand-name') as HTMLInputElement).value,
    tagline: (document.getElementById('hdr-tagline') as HTMLInputElement).value,
    badge_text: (document.getElementById('hdr-badge-text') as HTMLInputElement).value,
    working_hours: (document.getElementById('hdr-working-hours') as HTMLInputElement).value,
    helpline: (document.getElementById('hdr-helpline') as HTMLInputElement).value,
    email: (document.getElementById('hdr-email') as HTMLInputElement).value,
    portal_btn_text: (document.getElementById('hdr-portal-btn') as HTMLInputElement).value,
    book_btn_text: (document.getElementById('hdr-book-btn') as HTMLInputElement).value
  };

  const res = await fetch(`${API_BASE}/admin/site-content/header`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showToast('Header & top-bar settings updated successfully in MySQL!');
  } else {
    showToast('Failed to save header settings', 'error');
  }
});

// 2. Hero Banner & Stats CMS
async function loadHeroCms() {
  try {
    const [heroRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/site-content/hero`),
      fetch(`${API_BASE}/site-content/stats`)
    ]);

    currentHeroContent = await heroRes.json();
    if (currentHeroContent) {
      (document.getElementById('hero-eyebrow') as HTMLInputElement).value = currentHeroContent.eyebrow || '';
      (document.getElementById('hero-title-prefix') as HTMLInputElement).value = currentHeroContent.headline_prefix || '';
      (document.getElementById('hero-title-highlight') as HTMLInputElement).value = currentHeroContent.headline_highlight || '';
      (document.getElementById('hero-subtext') as HTMLTextAreaElement).value = currentHeroContent.subtext || '';
      (document.getElementById('hero-btn1-text') as HTMLInputElement).value = currentHeroContent.btn_primary_text || '';
      (document.getElementById('hero-btn1-link') as HTMLInputElement).value = currentHeroContent.btn_primary_link || '';
      (document.getElementById('hero-btn2-text') as HTMLInputElement).value = currentHeroContent.btn_secondary_text || '';
      (document.getElementById('hero-btn2-link') as HTMLInputElement).value = currentHeroContent.btn_secondary_link || '';
      (document.getElementById('hero-image-url') as HTMLInputElement).value = currentHeroContent.image_url || '';
      (document.getElementById('hero-badge-top') as HTMLInputElement).value = currentHeroContent.badge_top || '';
      (document.getElementById('hero-badge-bottom') as HTMLInputElement).value = currentHeroContent.badge_bottom || '';

      const heroImg = document.getElementById('hero-img-preview') as HTMLImageElement;
      if (heroImg && currentHeroContent.image_url) heroImg.src = currentHeroContent.image_url;

      if (Array.isArray(currentHeroContent.features)) {
        if (currentHeroContent.features[0]) {
          (document.getElementById('feat-1-title') as HTMLInputElement).value = currentHeroContent.features[0].title || '';
          (document.getElementById('feat-1-sub') as HTMLInputElement).value = currentHeroContent.features[0].subtitle || '';
        }
        if (currentHeroContent.features[1]) {
          (document.getElementById('feat-2-title') as HTMLInputElement).value = currentHeroContent.features[1].title || '';
          (document.getElementById('feat-2-sub') as HTMLInputElement).value = currentHeroContent.features[1].subtitle || '';
        }
        if (currentHeroContent.features[2]) {
          (document.getElementById('feat-3-title') as HTMLInputElement).value = currentHeroContent.features[2].title || '';
          (document.getElementById('feat-3-sub') as HTMLInputElement).value = currentHeroContent.features[2].subtitle || '';
        }
        if (currentHeroContent.features[3]) {
          (document.getElementById('feat-4-title') as HTMLInputElement).value = currentHeroContent.features[3].title || '';
          (document.getElementById('feat-4-sub') as HTMLInputElement).value = currentHeroContent.features[3].subtitle || '';
        }
      }
    }

    const stats = await statsRes.json();
    if (Array.isArray(stats)) {
      if (stats[0]) {
        (document.getElementById('stat-1-val') as HTMLInputElement).value = stats[0].value || '';
        (document.getElementById('stat-1-lbl') as HTMLInputElement).value = stats[0].label || '';
      }
      if (stats[1]) {
        (document.getElementById('stat-2-val') as HTMLInputElement).value = stats[1].value || '';
        (document.getElementById('stat-2-lbl') as HTMLInputElement).value = stats[1].label || '';
      }
      if (stats[2]) {
        (document.getElementById('stat-3-val') as HTMLInputElement).value = stats[2].value || '';
        (document.getElementById('stat-3-lbl') as HTMLInputElement).value = stats[2].label || '';
      }
      if (stats[3]) {
        (document.getElementById('stat-4-val') as HTMLInputElement).value = stats[3].value || '';
        (document.getElementById('stat-4-lbl') as HTMLInputElement).value = stats[3].label || '';
      }
    }
  } catch (err) {
    console.error('Error loading hero & stats CMS:', err);
  }
}

document.getElementById('hero-cms-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  currentHeroContent.eyebrow = (document.getElementById('hero-eyebrow') as HTMLInputElement).value;
  currentHeroContent.headline_prefix = (document.getElementById('hero-title-prefix') as HTMLInputElement).value;
  currentHeroContent.headline_highlight = (document.getElementById('hero-title-highlight') as HTMLInputElement).value;
  currentHeroContent.subtext = (document.getElementById('hero-subtext') as HTMLTextAreaElement).value;
  currentHeroContent.btn_primary_text = (document.getElementById('hero-btn1-text') as HTMLInputElement).value;
  currentHeroContent.btn_primary_link = (document.getElementById('hero-btn1-link') as HTMLInputElement).value;
  currentHeroContent.btn_secondary_text = (document.getElementById('hero-btn2-text') as HTMLInputElement).value;
  currentHeroContent.btn_secondary_link = (document.getElementById('hero-btn2-link') as HTMLInputElement).value;
  currentHeroContent.image_url = (document.getElementById('hero-image-url') as HTMLInputElement).value;
  currentHeroContent.badge_top = (document.getElementById('hero-badge-top') as HTMLInputElement).value;
  currentHeroContent.badge_bottom = (document.getElementById('hero-badge-bottom') as HTMLInputElement).value;

  const res = await fetch(`${API_BASE}/admin/site-content/hero`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentHeroContent)
  });

  if (res.ok) {
    showToast('Hero Banner content updated successfully in MySQL!');
  } else {
    showToast('Failed to save Hero Banner', 'error');
  }
});

document.getElementById('hero-features-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  currentHeroContent.features = [
    { id: 1, icon_class: "feat-teal", title: (document.getElementById('feat-1-title') as HTMLInputElement).value, subtitle: (document.getElementById('feat-1-sub') as HTMLInputElement).value },
    { id: 2, icon_class: "feat-orange", title: (document.getElementById('feat-2-title') as HTMLInputElement).value, subtitle: (document.getElementById('feat-2-sub') as HTMLInputElement).value },
    { id: 3, icon_class: "feat-blue", title: (document.getElementById('feat-3-title') as HTMLInputElement).value, subtitle: (document.getElementById('feat-3-sub') as HTMLInputElement).value },
    { id: 4, icon_class: "feat-green", title: (document.getElementById('feat-4-title') as HTMLInputElement).value, subtitle: (document.getElementById('feat-4-sub') as HTMLInputElement).value }
  ];

  const res = await fetch(`${API_BASE}/admin/site-content/hero`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentHeroContent)
  });

  if (res.ok) {
    showToast('Hero 4 Key Features updated in MySQL!');
  } else {
    showToast('Failed to save key features', 'error');
  }
});

document.getElementById('stats-cms-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const statsPayload = [
    { id: 1, value: (document.getElementById('stat-1-val') as HTMLInputElement).value, label: (document.getElementById('stat-1-lbl') as HTMLInputElement).value, color: 'teal' },
    { id: 2, value: (document.getElementById('stat-2-val') as HTMLInputElement).value, label: (document.getElementById('stat-2-lbl') as HTMLInputElement).value, color: 'blue' },
    { id: 3, value: (document.getElementById('stat-3-val') as HTMLInputElement).value, label: (document.getElementById('stat-3-lbl') as HTMLInputElement).value, color: 'orange' },
    { id: 4, value: (document.getElementById('stat-4-val') as HTMLInputElement).value, label: (document.getElementById('stat-4-lbl') as HTMLInputElement).value, color: 'green' }
  ];

  const res = await fetch(`${API_BASE}/admin/site-content/stats`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statsPayload)
  });

  if (res.ok) {
    showToast('Key Lab Statistics Counter saved to MySQL!');
  } else {
    showToast('Failed to save stats counter', 'error');
  }
});

// 3. Doctor / Chief Pathologist & Central Lab CMS
async function loadDoctorHospital() {
  try {
    const [docRes, clinicRes] = await Promise.all([
      fetch(`${API_BASE}/site-content/doctor_info`),
      fetch(`${API_BASE}/site-content/clinic_info`)
    ]);

    const doc = await docRes.json();
    if (doc) {
      (document.getElementById('doc-name') as HTMLInputElement).value = doc.name || '';
      (document.getElementById('doc-degrees') as HTMLInputElement).value = doc.degrees || '';
      (document.getElementById('doc-spec') as HTMLInputElement).value = doc.specialization || '';
      (document.getElementById('doc-exp') as HTMLInputElement).value = String(doc.experience_years || 18);
      (document.getElementById('doc-opd') as HTMLInputElement).value = doc.opd_schedule || '';
      (document.getElementById('doc-bio') as HTMLTextAreaElement).value = doc.bio || '';
      (document.getElementById('doc-highlights') as HTMLTextAreaElement).value = Array.isArray(doc.highlights) ? doc.highlights.join('\n') : (doc.highlights || '');
      (document.getElementById('doc-image-url') as HTMLInputElement).value = doc.image_url || '';
      const docPreview = document.getElementById('doc-img-preview') as HTMLImageElement;
      if (docPreview && doc.image_url) docPreview.src = doc.image_url;
    }

    const clinic = await clinicRes.json();
    if (clinic) {
      (document.getElementById('clinic-name') as HTMLInputElement).value = clinic.hospital_name || '';
      (document.getElementById('clinic-phone') as HTMLInputElement).value = clinic.helpline || '';
      (document.getElementById('clinic-emergency') as HTMLInputElement).value = clinic.emergency_phone || '';
      (document.getElementById('clinic-email') as HTMLInputElement).value = clinic.email || '';
      (document.getElementById('clinic-timings') as HTMLInputElement).value = clinic.opd_timings || '';
      (document.getElementById('clinic-address') as HTMLTextAreaElement).value = clinic.address || '';
      (document.getElementById('clinic-directions') as HTMLTextAreaElement).value = clinic.directions || '';
      (document.getElementById('clinic-image-url') as HTMLInputElement).value = clinic.clinic_image || '';
      const clinicPreview = document.getElementById('clinic-img-preview') as HTMLImageElement;
      if (clinicPreview && clinic.clinic_image) clinicPreview.src = clinic.clinic_image;
    }
  } catch (err) {
    console.error('Error loading doctor & hospital CMS:', err);
  }
}

document.getElementById('doc-cms-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const highlightsText = (document.getElementById('doc-highlights') as HTMLTextAreaElement).value;
  const highlights = highlightsText.split('\n').map(s => s.trim()).filter(Boolean);

  const payload = {
    name: (document.getElementById('doc-name') as HTMLInputElement).value,
    degrees: (document.getElementById('doc-degrees') as HTMLInputElement).value,
    specialization: (document.getElementById('doc-spec') as HTMLInputElement).value,
    experience_years: parseInt((document.getElementById('doc-exp') as HTMLInputElement).value) || 18,
    opd_schedule: (document.getElementById('doc-opd') as HTMLInputElement).value,
    bio: (document.getElementById('doc-bio') as HTMLTextAreaElement).value,
    highlights,
    image_url: (document.getElementById('doc-image-url') as HTMLInputElement).value
  };

  const res = await fetch(`${API_BASE}/admin/site-content/doctor_info`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showToast('Chief Pathologist Profile saved to MySQL!');
  } else {
    showToast('Failed to save pathologist profile', 'error');
  }
});

document.getElementById('clinic-cms-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    hospital_name: (document.getElementById('clinic-name') as HTMLInputElement).value,
    helpline: (document.getElementById('clinic-phone') as HTMLInputElement).value,
    emergency_phone: (document.getElementById('clinic-emergency') as HTMLInputElement).value,
    email: (document.getElementById('clinic-email') as HTMLInputElement).value,
    opd_timings: (document.getElementById('clinic-timings') as HTMLInputElement).value,
    address: (document.getElementById('clinic-address') as HTMLTextAreaElement).value,
    directions: (document.getElementById('clinic-directions') as HTMLTextAreaElement).value,
    clinic_image: (document.getElementById('clinic-image-url') as HTMLInputElement).value
  };

  const res = await fetch(`${API_BASE}/admin/site-content/clinic_info`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showToast('Central Lab & Facility Details saved to MySQL!');
  } else {
    showToast('Failed to save lab details', 'error');
  }
});

// 4. About Us & Footer CMS
async function loadAboutFooter() {
  try {
    const [aboutRes, footerRes] = await Promise.all([
      fetch(`${API_BASE}/site-content/about`),
      fetch(`${API_BASE}/site-content/footer`)
    ]);

    const about = await aboutRes.json();
    if (about) {
      (document.getElementById('about-title') as HTMLInputElement).value = about.title || '';
      (document.getElementById('about-badge') as HTMLInputElement).value = about.experience_badge || '';
      (document.getElementById('about-story') as HTMLTextAreaElement).value = about.story || '';
      (document.getElementById('about-image-url') as HTMLInputElement).value = about.facility_image || '';
      const aboutPreview = document.getElementById('about-img-preview') as HTMLImageElement;
      if (aboutPreview && about.facility_image) aboutPreview.src = about.facility_image;
    }

    const footer = await footerRes.json();
    if (footer) {
      (document.getElementById('footer-about') as HTMLTextAreaElement).value = footer.about_text || '';
      (document.getElementById('footer-copyright') as HTMLInputElement).value = footer.copyright || '';
      (document.getElementById('footer-emergency') as HTMLInputElement).value = footer.emergency_notice || '';
      (document.getElementById('footer-fb') as HTMLInputElement).value = footer.facebook || '';
      (document.getElementById('footer-ig') as HTMLInputElement).value = footer.instagram || '';
      (document.getElementById('footer-tw') as HTMLInputElement).value = footer.twitter || '';
      (document.getElementById('footer-yt') as HTMLInputElement).value = footer.youtube || '';
    }
  } catch (err) {
    console.error('Error loading about & footer CMS:', err);
  }
}

document.getElementById('about-cms-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: (document.getElementById('about-title') as HTMLInputElement).value,
    experience_badge: (document.getElementById('about-badge') as HTMLInputElement).value,
    story: (document.getElementById('about-story') as HTMLTextAreaElement).value,
    facility_image: (document.getElementById('about-image-url') as HTMLInputElement).value
  };

  const res = await fetch(`${API_BASE}/admin/site-content/about`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showToast('About Us content saved to MySQL!');
  } else {
    showToast('Failed to save about content', 'error');
  }
});

document.getElementById('footer-cms-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    about_text: (document.getElementById('footer-about') as HTMLTextAreaElement).value,
    copyright: (document.getElementById('footer-copyright') as HTMLInputElement).value,
    emergency_notice: (document.getElementById('footer-emergency') as HTMLInputElement).value,
    facebook: (document.getElementById('footer-fb') as HTMLInputElement).value,
    instagram: (document.getElementById('footer-ig') as HTMLInputElement).value,
    twitter: (document.getElementById('footer-tw') as HTMLInputElement).value,
    youtube: (document.getElementById('footer-yt') as HTMLInputElement).value
  };

  const res = await fetch(`${API_BASE}/admin/site-content/footer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showToast('Footer & Social Links saved to MySQL!');
  } else {
    showToast('Failed to save footer settings', 'error');
  }
});

// ============================================
// VIEW SWITCHING
// ============================================
function switchView(view: string) {
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(m => {
    if (m.getAttribute('data-view') === view) {
      m.classList.add('active');
    } else {
      m.classList.remove('active');
    }
  });

  const heading = document.getElementById('page-heading');
  const kpiGrid = document.querySelector('.kpi-grid') as HTMLElement;
  const bookingsSec = document.getElementById('sec-bookings');
  const splitSec = document.getElementById('sec-dashboard-split');
  const patientsSec = document.getElementById('sec-patients');

  const secHeaderMenus = document.getElementById('sec-header-menus');
  const secHeroCms = document.getElementById('sec-hero-cms');
  const secDocHospital = document.getElementById('sec-doctor-hospital');
  const secAboutFooter = document.getElementById('sec-about-footer');

  // Hide all sections initially
  if (bookingsSec) bookingsSec.style.display = 'none';
  if (splitSec) splitSec.style.display = 'none';
  if (patientsSec) patientsSec.style.display = 'none';
  if (secHeaderMenus) secHeaderMenus.style.display = 'none';
  if (secHeroCms) secHeroCms.style.display = 'none';
  if (secDocHospital) secDocHospital.style.display = 'none';
  if (secAboutFooter) secAboutFooter.style.display = 'none';

  if (view === 'header-menus') {
    if (heading) heading.innerText = 'Website CMS: Brand, Top-Bar & Navigation Menus';
    if (kpiGrid) kpiGrid.style.display = 'none';
    if (secHeaderMenus) secHeaderMenus.style.display = 'block';
    loadHeaderMenus();
  } else if (view === 'hero-cms') {
    if (heading) heading.innerText = 'Website CMS: Hero Banner, Highlights & Floating Stats';
    if (kpiGrid) kpiGrid.style.display = 'none';
    if (secHeroCms) secHeroCms.style.display = 'block';
    loadHeroCms();
  } else if (view === 'doctor-hospital') {
    if (heading) heading.innerText = 'Website CMS: Chief Pathologist Profile & Central Lab Details';
    if (kpiGrid) kpiGrid.style.display = 'none';
    if (secDocHospital) secDocHospital.style.display = 'block';
    loadDoctorHospital();
  } else if (view === 'about-footer') {
    if (heading) heading.innerText = 'Website CMS: About Laboratory, Facility Showcase & Footer';
    if (kpiGrid) kpiGrid.style.display = 'none';
    if (secAboutFooter) secAboutFooter.style.display = 'block';
    loadAboutFooter();
  } else if (view === 'patients') {
    if (heading) heading.innerText = 'Registered Patient Accounts & User Profiles';
    if (kpiGrid) kpiGrid.style.display = 'grid';
    if (patientsSec) patientsSec.style.display = 'block';
    loadPatients();
  } else if (view === 'bookings') {
    if (heading) heading.innerText = 'Patient Test Bookings & Diagnostic Queue';
    if (kpiGrid) kpiGrid.style.display = 'grid';
    if (bookingsSec) bookingsSec.style.display = 'block';
    loadBookings();
  } else if (view === 'services' || view === 'packages') {
    if (heading) heading.innerText = view === 'services' ? 'Diagnostic Services Catalog' : 'Health Checkup Packages';
    if (kpiGrid) kpiGrid.style.display = 'grid';
    if (splitSec) splitSec.style.display = 'flex';
  } else if (view === 'inquiries') {
    if (heading) heading.innerText = 'Patient Inquiries & Prescriptions';
    if (kpiGrid) kpiGrid.style.display = 'grid';
    if (bookingsSec) bookingsSec.style.display = 'block';
  } else {
    // dashboard
    if (heading) heading.innerText = 'Diagnostic Operations Dashboard';
    if (kpiGrid) kpiGrid.style.display = 'grid';
    if (bookingsSec) bookingsSec.style.display = 'block';
    if (splitSec) splitSec.style.display = 'flex';
  }
}

// Sidebar Tab Switcher click handlers
document.querySelectorAll('.sidebar-menu .menu-item[data-view]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const view = item.getAttribute('data-view') || 'dashboard';
    switchView(view);
  });
});

// Refresh Button Listener
document.getElementById('btn-refresh-data')?.addEventListener('click', async () => {
  await loadStats();
  await loadBookings();
  await loadPatients();
});

function initDashboardData() {
  loadStats();
  loadBookings();
  loadLists();
  loadPatients();
}

// Init Check
checkAdminAuth();
if (localStorage.getItem('healthlab_admin_token')) {
  initDashboardData();
}
switchView('dashboard');

