(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function e(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(o){if(o.ep)return;o.ep=!0;const a=e(o);fetch(o.href,a)}})();const u=window.location.port==="3001"?"http://localhost:5001/api":"/api";function p(n){const t=document.getElementById("web-toast");t&&(t.innerText=n,t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),4e3))}window.showWebToast=p;function C(){const n=document.getElementById("navMenu"),t=document.getElementById("hamburgerBtn");n&&t&&(n.classList.toggle("open"),t.classList.toggle("active"))}window.toggleMobileNav=C;function q(){const n=document.getElementById("navMenu"),t=document.getElementById("hamburgerBtn");n&&n.classList.remove("open"),t&&t.classList.remove("active")}window.closeMobileNav=q;function j(){document.querySelectorAll(".modal").forEach(n=>n.classList.remove("open"))}window.closeWebModals=j;function v(n,t=!0){var o;if(typeof window<"u"&&window.event)try{window.event.preventDefault()}catch{}const e=n.replace("#/","").replace("#","").replace("/","")||"home";t&&window.location.pathname!==`/${e}`&&history.pushState(null,"",`/${e}`),document.querySelectorAll(".nav-links .nav-link").forEach(a=>{a.getAttribute("data-route")===e?a.classList.add("active"):a.classList.remove("active"),a.blur()}),document.querySelectorAll(".page-view").forEach(a=>a.classList.remove("active"));const i=document.getElementById(`page-${e}`);i?i.classList.add("active"):(o=document.getElementById("page-home"))==null||o.classList.add("active"),e==="portal"&&z(),window.scrollTo({top:0,behavior:"smooth"})}window.navigateTo=v;window.addEventListener("popstate",()=>{const n=window.location.pathname.replace("/","")||"home";v(n,!1)});document.addEventListener("click",n=>{const t=n.target.closest("a");if(!t)return;const e=t.getAttribute("href");if(e&&(e.startsWith("/")||e.startsWith("#/"))&&!e.startsWith("//")&&!t.getAttribute("target")&&!t.getAttribute("download")){n.preventDefault();const i=e.replace("#/","").replace("/","");v(i)}});window.setQuickBooking=()=>{v("home"),setTimeout(()=>{var n;(n=document.getElementById("booking"))==null||n.scrollIntoView({behavior:"smooth"})},100)};window.selectPackageForBooking=n=>{v("home"),setTimeout(()=>{var e;const t=document.getElementById("booking-test");if(t){let i=!1;for(let o=0;o<t.options.length;o++)if(t.options[o].value.includes(n.split(" ")[0])){t.selectedIndex=o,i=!0;break}if(!i){const o=document.createElement("option");o.value=n,o.text=n,o.selected=!0,t.appendChild(o)}}(e=document.getElementById("booking"))==null||e.scrollIntoView({behavior:"smooth"})},100)};window.selectServiceForBooking=n=>{window.selectPackageForBooking(n)};window.selectHomeCollection=()=>{v("home"),setTimeout(()=>{var t;const n=document.querySelector('input[name="visit_type"][value="home_collection"]');n&&(n.checked=!0,n.dispatchEvent(new Event("change"))),(t=document.getElementById("booking"))==null||t.scrollIntoView({behavior:"smooth"})},100)};const B=document.getElementById("booking-date");if(B){const n=new Date().toISOString().split("T")[0];B.min=n,B.value=n}const O=document.querySelectorAll('input[name="visit_type"]'),E=document.getElementById("address-group");O.forEach(n=>{n.addEventListener("change",()=>{if(E){E.style.display=n.value==="home_collection"?"block":"none";const t=document.getElementById("patient-address");t&&(t.required=n.value==="home_collection")}})});const w=document.getElementById("booking-form"),I=document.getElementById("booking-modal"),k=document.getElementById("modal-details");w&&w.addEventListener("submit",async n=>{var r,f,y;n.preventDefault();const t=w.querySelector('button[type="submit"]');t&&(t.disabled=!0,t.innerText="Submitting Booking...");const e=document.getElementById("booking-test").value,i=document.getElementById("booking-date").value,o=document.getElementById("booking-time").value,a=((r=document.querySelector('input[name="visit_type"]:checked'))==null?void 0:r.value)||"lab_visit",s=document.getElementById("patient-name").value,l=document.getElementById("patient-phone").value,m=document.getElementById("patient-email").value,c=((f=document.getElementById("patient-address"))==null?void 0:f.value)||"",d={patient_name:s,email:m,phone:l,appointment_date:i,appointment_time:o,visit_type:a,test_or_package:e,address:c,notes:""};try{const x=await(await fetch(`${u}/bookings`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)})).json();I&&k&&(k.innerHTML=`
          <div><strong>Booking Ref:</strong> <span class="code-pill">${((y=x.booking)==null?void 0:y.booking_code)||"HL-"+Date.now()}</span></div>
          <div><strong>Patient:</strong> ${s}</div>
          <div><strong>Test/Package:</strong> ${e}</div>
          <div><strong>Date & Slot:</strong> 📅 ${i} at ⏰ ${o}</div>
          <div><strong>Type:</strong> ${a==="home_collection"?"🏠 Doorstep Home Collection":"🏥 Lab Visit (Green Park)"}</div>
          ${c?`<div><strong>Address:</strong> ${c}</div>`:""}
          <div style="margin-top:12px; color:#166534; font-weight:700;">✨ You can track report findings in the Patient Portal using this Booking Ref!</div>
        `,I.classList.add("open")),w.reset(),p("Test booking submitted successfully to HealthLab database!")}catch{p("Connection error. Please ensure server is running.")}finally{t&&(t.disabled=!1,t.innerText="Book Now ➔")}});var T;(T=document.getElementById("contact-inquiry-form"))==null||T.addEventListener("submit",async n=>{n.preventDefault();const t={name:document.getElementById("inq-name").value,phone:document.getElementById("inq-phone").value,email:document.getElementById("inq-email").value,subject:document.getElementById("inq-subject").value,message:document.getElementById("inq-message").value};try{const e=await fetch(`${u}/inquiries`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),i=await e.json();e.ok&&i.success?(document.getElementById("contact-inquiry-form").reset(),p("Inquiry received! Our pathology desk will reach out.")):p("Could not submit inquiry. Please try again.")}catch{p("Network error while sending inquiry.")}});let g=JSON.parse(localStorage.getItem("healthlab_patient")||"null"),b=[];window.switchPortalAuthTab=n=>{const t=document.getElementById("portal-auth-login-wrap"),e=document.getElementById("portal-auth-register-wrap"),i=document.getElementById("tab-btn-login"),o=document.getElementById("tab-btn-register");n==="login"?(t&&(t.style.display="block"),e&&(e.style.display="none"),i==null||i.classList.add("active"),o==null||o.classList.remove("active")):(t&&(t.style.display="none"),e&&(e.style.display="block"),i==null||i.classList.remove("active"),o==null||o.classList.add("active"))};window.logoutPatient=()=>{g=null,localStorage.removeItem("healthlab_patient"),localStorage.removeItem("healthlab_patient_token"),b=[];const n=document.getElementById("portal-guest-view"),t=document.getElementById("portal-user-view");n&&(n.style.display="block"),t&&(t.style.display="none"),p("Signed out of Patient Portal.")};async function z(){g&&await _()}async function _(){if(!g)return;const n=localStorage.getItem("healthlab_patient_token");try{const t=await fetch(`${u}/patients/appointments`,{headers:{Authorization:`Bearer ${n}`}}),e=await t.json();t.ok?(b=e.appointments||e.bookings||(Array.isArray(e)?e:[]),P(g.patient_name,g.phone,b,!1)):window.logoutPatient()}catch{p("Could not load diagnostic records.")}}function P(n,t,e,i=!1){const o=document.getElementById("portal-guest-view"),a=document.getElementById("portal-user-view"),s=document.getElementById("portal-user-name"),l=document.getElementById("portal-user-meta"),m=document.getElementById("portal-appt-count"),c=document.getElementById("portal-appointments-container"),d=document.getElementById("btn-portal-logout");if(o&&(o.style.display="none"),a&&(a.style.display="block"),s&&(s.innerText=i?`Diagnostic Records for: ${n}`:`Welcome, ${n}`),l&&(l.innerText=i?`Lookup Query: ${t}`:`Registered Mobile: ${t}`),m&&(m.innerText=e.length.toString()),d&&(d.innerText=i?"← Back to Search":"Sign Out / Exit"),!!c){if(e.length===0){c.innerHTML=`
      <div style="background:#fff; border:1px solid #E2E8F0; border-radius:12px; padding:32px; text-align:center; color:#64748B;">
        <p style="font-size:16px; font-weight:700; color:#0F172A; margin-bottom:6px;">No diagnostic reports found for this query.</p>
        <p style="font-size:13.5px; margin-bottom:16px;">Please verify your booking reference code or registered phone.</p>
        <button class="btn-primary" onclick="setQuickBooking()">Book a Test Now</button>
      </div>
    `;return}c.innerHTML=e.map(r=>{const f=r.status==="completed"?"status-pill-completed":r.status==="confirmed"?"status-pill-confirmed":"status-pill-pending",y=(r.status||"pending").replace("_"," ").toUpperCase(),h=r.doctor_notes&&r.doctor_notes.trim().length>0,x=r.test_results&&r.test_results.trim().length>0,M=r.doctor_prescription&&r.doctor_prescription.trim().length>0,F=r.follow_up_date&&r.follow_up_date.length>0,N=r.appointment_date?r.appointment_date.includes("T")?r.appointment_date.split("T")[0]:r.appointment_date:"";return`
      <div class="portal-appt-card">
        <div class="appt-top-bar">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="code-pill">${r.booking_code}</span>
            <span style="font-size:13px; color:#64748B;">${r.visit_type==="home_collection"?"🏠 Home Collection":"🏥 Lab Visit (Green Park)"}</span>
          </div>
          <span class="${f}">${y}</span>
        </div>

        <div class="appt-patient-row">
          <div>
            <small>Patient Name</small>
            <strong>${r.patient_name}</strong>
          </div>
          <div>
            <small>Test / Package</small>
            <strong>${r.test_or_package}</strong>
          </div>
          <div>
            <small>Appointment Date</small>
            <strong>📅 ${N}</strong>
          </div>
          <div>
            <small>Time Slot</small>
            <strong>⏰ ${r.appointment_time||"09:00 AM"}</strong>
          </div>
        </div>

        <!-- Pathologist Clinical Findings & Test Parameters -->
        <div class="diagnostic-report-box">
          <div class="diagnostic-report-hdr">
            <span>🔬</span> Pathologist Clinical Assessment & Findings
          </div>
          <div style="font-size:13.5px; color:#1E293B; line-height:1.6;">
            ${h?r.doctor_notes:'<em style="color:#94A3B8;">Sample received in laboratory. Biochemical analysis in progress. Verified findings will appear here shortly.</em>'}
          </div>

          ${x?`
            <div style="margin-top:12px;">
              <strong style="color:#166534; font-size:13px; display:block; margin-bottom:4px;">📊 Measured Biomarkers & Parameter Breakdown:</strong>
              <div class="lab-parameters-box">${r.test_results}</div>
            </div>
          `:""}

          ${M?`
            <div class="rx-diet-box">
              <strong>🩺 Doctor Prescriptions & Lifestyle Advice:</strong>
              <div class="rx-diet-text">${r.doctor_prescription}</div>
            </div>
          `:""}

          ${F?`
            <div class="followup-strip">
              <span>📅</span> Next Recommended Review: ${r.follow_up_date.includes("T")?r.follow_up_date.split("T")[0]:r.follow_up_date}
            </div>
          `:""}
        </div>

        <div class="appt-card-actions">
          <span style="font-size:12px; color:#94A3B8;">Reporting Pathologist: <strong>Dr. Rajesh Malhotra, MD Pathology</strong></span>
          <button class="btn-print-slip" onclick="openDiagnosticSlip('${r.booking_code}')">
            🖨️ View & Print Diagnostic Report Slip
          </button>
        </div>
      </div>
    `}).join("")}}window.openDiagnosticSlip=n=>{var o;const t=b.find(a=>a.booking_code===n);if(!t)return;const e=document.getElementById("modal-slip-body");if(!e)return;const i=t.appointment_date?t.appointment_date.includes("T")?t.appointment_date.split("T")[0]:t.appointment_date:"";e.innerHTML=`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; font-size:13px; background:#F8FAFC; padding:14px; border-radius:8px;">
      <div>
        <p style="margin:0 0 6px;"><strong>Booking Ref:</strong> <span class="code-pill">${t.booking_code}</span></p>
        <p style="margin:0 0 6px;"><strong>Patient:</strong> ${t.patient_name}</p>
        <p style="margin:0;"><strong>Contact:</strong> ${t.phone}</p>
      </div>
      <div>
        <p style="margin:0 0 6px;"><strong>Date & Time:</strong> ${i} at ${t.appointment_time}</p>
        <p style="margin:0 0 6px;"><strong>Test / Profile:</strong> ${t.test_or_package}</p>
        <p style="margin:0;"><strong>Status:</strong> <span style="text-transform:uppercase; font-weight:800; color:#00897B;">${t.status}</span></p>
      </div>
    </div>

    <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:16px; margin-bottom:16px;">
      <h4 style="font-size:14px; font-weight:800; color:#166534; margin:0 0 6px;">Pathologist Clinical Assessment:</h4>
      <p style="font-size:13.5px; color:#1E293B; line-height:1.6; margin:0;">
        ${t.doctor_notes||"Testing in progress / Verification pending."}
      </p>

      ${t.test_results?`
        <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #BBF7D0;">
          <h4 style="font-size:13.5px; font-weight:800; color:#166534; margin:0 0 6px;">Diagnostic Values:</h4>
          <pre style="white-space:pre-line; font-family:monospace; font-size:12.5px; color:#334155; margin:0; background:#fff; padding:10px; border-radius:6px; border:1px solid #DCFCE7;">${t.test_results}</pre>
        </div>
      `:""}

      ${t.doctor_prescription?`
        <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #BBF7D0;">
          <h4 style="font-size:13.5px; font-weight:800; color:#166534; margin:0 0 6px;">Physician Guidance & Next Steps:</h4>
          <pre style="white-space:pre-line; font-family:inherit; font-size:13px; color:#334155; margin:0;">${t.doctor_prescription}</pre>
        </div>
      `:""}
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#64748B; margin-top:16px;">
      <span>NABL Accredited Laboratory No: MC-4921</span>
      <span style="font-weight:700; color:#0F172A;">Authorized Signatory: Dr. Rajesh Malhotra, MD Pathology</span>
    </div>
  `,(o=document.getElementById("modal-diagnostic-slip"))==null||o.classList.add("open")};var $;($=document.getElementById("portal-track-form"))==null||$.addEventListener("submit",async n=>{n.preventDefault();const t=document.getElementById("track-query-input").value.trim();if(t)try{const e=await fetch(`${u}/appointments/track?query=${encodeURIComponent(t)}`),i=await e.json();e.ok&&i.success?(b=i.appointments||i.bookings||[],P(t,t,b,!0),p(`Found ${b.length} diagnostic record(s).`)):p(i.error||"No matching diagnostic record found.")}catch{p("Network error while tracking report.")}});var L;(L=document.getElementById("portal-login-form"))==null||L.addEventListener("submit",async n=>{n.preventDefault();const t=document.getElementById("login-identifier").value.trim(),e=document.getElementById("login-password").value;try{const i=await fetch(`${u}/patients/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identifier:t,password:e})}),o=await i.json();i.ok&&o.success?(g=o.patient,localStorage.setItem("healthlab_patient",JSON.stringify(g)),localStorage.setItem("healthlab_patient_token",o.token),p(`Welcome back, ${g.patient_name}!`),await _()):p(o.error||"Login failed. Check credentials.")}catch{p("Network error during login.")}});var S;(S=document.getElementById("portal-register-form"))==null||S.addEventListener("submit",async n=>{n.preventDefault();const t=document.getElementById("reg-name").value.trim(),e=document.getElementById("reg-phone").value.trim(),i=document.getElementById("reg-email").value.trim(),o=document.getElementById("reg-password").value;try{const a=await fetch(`${u}/patients/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({patient_name:t,phone:e,email:i,password:o})}),s=await a.json();a.ok&&s.success?(g=s.patient,localStorage.setItem("healthlab_patient",JSON.stringify(g)),localStorage.setItem("healthlab_patient_token",s.token),p(`Account created! Welcome, ${g.patient_name}!`),await _()):p(s.error||"Registration failed.")}catch{p("Network error during registration.")}});async function H(){const n=document.getElementById("web-bmi-weight").value,t=document.getElementById("web-bmi-height").value,e=document.getElementById("web-bmi-result");if(!e)return;try{const s=await fetch(`${u}/tools/bmi`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({weight_kg:n,height_cm:t})}),l=await s.json();if(s.ok&&l.success){e.innerHTML=`
        <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:14px;">
          <p style="margin:0; font-weight:800; color:#166534; font-size:15px;">Your BMI: ${l.bmi} (${l.category})</p>
          <p style="margin:4px 0 0; font-size:13px; color:#15803D;">Daily Water Target: <strong>${l.daily_water_liters} Liters/day</strong> | Health Risk: ${l.risk}</p>
        </div>
      `;return}}catch{}const i=parseFloat(n)||70,o=(parseFloat(t)||172)/100,a=(i/(o*o)).toFixed(1);e.innerHTML=`
    <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:14px;">
      <p style="margin:0; font-weight:800; color:#166534; font-size:15px;">Your BMI: ${a} (Normal Weight)</p>
      <p style="margin:4px 0 0; font-size:13px; color:#15803D;">Daily Water Target: <strong>${(i*.033).toFixed(1)} Liters/day</strong></p>
    </div>
  `}window.calculateWebBmi=H;async function R(){try{const n=await fetch(`${u}/site-content`);if(n.ok){const t=await n.json();W(t)}}catch(n){console.error("Error loading dynamic site content:",n)}}function W(n){var t;if(n){if(n.header){const e=n.header,i=document.getElementById("top-bar-badge");i&&e.badge_text&&(i.innerText=e.badge_text);const o=document.getElementById("top-bar-hours");o&&e.working_hours&&(o.innerText=e.working_hours);const a=document.getElementById("top-bar-phone");a&&e.helpline&&(a.innerText=e.helpline);const s=document.getElementById("top-bar-phone-link");s&&e.helpline&&(s.href=`tel:${e.helpline.replace(/[^0-9+]/g,"")}`);const l=document.getElementById("header-brand-title");l&&e.brand_name&&(l.innerText=e.brand_name);const m=document.getElementById("header-brand-tagline");m&&e.tagline&&(m.innerText=e.tagline);const c=document.getElementById("header-portal-btn-text");c&&e.portal_btn_text&&(c.innerText=e.portal_btn_text);const d=document.getElementById("header-book-btn");d&&e.book_btn_text&&(d.innerText=e.book_btn_text)}if(Array.isArray(n.menus)&&n.menus.length>0){const e=[...n.menus].sort((a,s)=>(a.sort_order||0)-(s.sort_order||0)).filter(a=>a.is_active!==!1&&a.visible!==!1),i=document.getElementById("main-nav-links-list");if(i&&e.length>0){const a=window.location.pathname.replace("/","")||"home";i.innerHTML=e.map(s=>`
        <li><a href="/${s.route}" data-route="${s.route}" class="nav-link ${a===s.route?"active":""}" onclick="navigateTo('${s.route}'); closeMobileNav()">${s.label}</a></li>
      `).join("")}const o=document.getElementById("footer-quick-links");o&&e.length>0&&(o.innerHTML=e.map(a=>`
        <li><a href="/${a.route}" onclick="navigateTo('${a.route}')">${a.label}</a></li>
      `).join(""))}if(n.hero){const e=n.hero,i=document.getElementById("hero-eyebrow-text");i&&e.eyebrow&&(i.innerText=e.eyebrow);const o=document.getElementById("hero-headline-elem"),a=e.headline_prefix||"Complete Diagnostic Care for a",s=e.headline_highlight||"Healthier Tomorrow";o&&(o.innerHTML=`${a} <span class="text-highlight">${s}</span>`);const l=document.getElementById("hero-subtext-elem");l&&e.subtext&&(l.innerText=e.subtext);const m=document.getElementById("hero-btn-primary");m&&e.btn_primary_text&&(m.innerText=e.btn_primary_text);const c=document.getElementById("hero-btn-secondary");c&&(e.btn_secondary_text&&(c.innerText=e.btn_secondary_text),e.btn_secondary_link&&(c.href=e.btn_secondary_link));const d=document.getElementById("hero-main-img");d&&e.image_url&&(d.src=e.image_url);const r=document.getElementById("hero-quote-text");if(r&&(e.badge_top||e.badge_bottom)&&(r.innerText=e.badge_top||e.badge_bottom),Array.isArray(e.features)&&e.features.length>0){const f=document.getElementById("hero-features-list");if(f){const y=["🏠","📄","🛡️","🔬"];f.innerHTML=e.features.map((h,x)=>`
          <div class="pill-item">
            <span class="pill-icon">${y[x%y.length]}</span>
            <span class="pill-text">${h.title||h.text||h}</span>
          </div>
        `).join("")}}}if(Array.isArray(n.stats)&&n.stats.length>0&&n.stats.forEach((e,i)=>{const o=document.getElementById(`stat-${i+1}-val`),a=document.getElementById(`stat-${i+1}-lbl`);o&&e.value&&(o.innerText=e.value),a&&e.label&&(a.innerText=e.label)}),n.doctor_info){const e=n.doctor_info,i=document.getElementById("doc-img");i&&e.image_url&&(i.src=e.image_url);const o=document.getElementById("doc-name-text");o&&e.name&&(o.innerText=e.name);const a=document.getElementById("doc-degrees-text");a&&e.degrees&&(a.innerText=e.degrees);const s=document.getElementById("doc-spec-text");s&&e.specialization&&(s.innerText=e.specialization);const l=document.getElementById("doc-exp-badge");l&&e.experience_years&&(l.innerText=`${e.experience_years}+ Years Experience`);const m=document.getElementById("doc-bio-text");m&&e.bio&&(m.innerText=e.bio);const c=document.getElementById("doc-schedule-text");if(c&&e.opd_schedule&&(c.innerText=e.opd_schedule),Array.isArray(e.highlights)&&e.highlights.length>0){const d=document.getElementById("doc-highlights-list");d&&(d.innerHTML=e.highlights.map(r=>`<li>${r}</li>`).join(""))}}if(n.clinic_info){const e=n.clinic_info,i=document.getElementById("facility-img");i&&e.clinic_image&&(i.src=e.clinic_image);const o=document.getElementById("facility-name-text");o&&e.hospital_name&&(o.innerText=e.hospital_name);const a=document.getElementById("facility-address-text");a&&e.address&&(a.innerText=e.address);const s=document.getElementById("facility-directions-text");s&&e.directions&&(s.innerText=e.directions);const l=document.getElementById("facility-helpline-text");l&&e.helpline&&(l.innerText=e.helpline);const m=document.getElementById("facility-emergency-text");m&&e.emergency_phone&&(m.innerText=e.emergency_phone);const c=document.getElementById("facility-email-text");c&&e.email&&(c.innerText=e.email);const d=document.getElementById("facility-timings-text");d&&e.opd_timings&&(d.innerText=e.opd_timings)}if(n.about){const e=n.about,i=document.getElementById("about-title-text");i&&e.title&&(i.innerText=e.title);const o=document.getElementById("about-story-text");o&&e.story&&(o.innerText=e.story);const a=document.getElementById("about-badge-val");a&&e.experience_badge&&(a.innerText=e.experience_badge);const s=document.getElementById("about-facility-img");s&&e.facility_image&&(s.src=e.facility_image)}if(n.footer){const e=n.footer,i=document.getElementById("footer-brand-title");i&&((t=n.header)!=null&&t.brand_name)&&(i.innerText=`${n.header.brand_name} Diagnostic Centre`);const o=document.getElementById("footer-about-text");o&&e.about_text&&(o.innerText=e.about_text);const a=document.getElementById("footer-copyright");a&&e.copyright&&(a.innerText=e.copyright);const s=document.getElementById("footer-emergency-notice");s&&e.emergency_notice&&(s.innerText=e.emergency_notice);const l=(m,c)=>{const d=document.getElementById(m);d&&c&&(d.href=c,d.target="_blank")};e.facebook&&l("footer-link-fb",e.facebook),e.instagram&&l("footer-link-ig",e.instagram),e.twitter&&l("footer-link-tw",e.twitter),e.youtube&&l("footer-link-yt",e.youtube)}}}const D=window.location.hash.replace("#/","").replace("#",""),V=window.location.pathname.replace("/",""),A=D||V||"home";(D||window.location.pathname==="/"||window.location.pathname==="")&&history.replaceState(null,"",`/${A}`);v(A,!1);R();
