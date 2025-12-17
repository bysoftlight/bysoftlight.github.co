// js/app.js

let CURRENT_USER = {};
let ALL_HISTORY = [];
let CURRENT_FILTER = 'week';
let DISPLAY_LIMIT = 7;
let FILTER_MONTH_IDX = new Date().getMonth();
let FILTER_YEAR_VAL = new Date().getFullYear();

// --- INIT ---
window.onload = function() {
    const savedId = localStorage.getItem('SALES_APP_USER_ID');
    if (savedId && savedId !== "null" && savedId !== "undefined") {
        performLogin(savedId);
    } else {
        document.getElementById('mainFooter').classList.add('login-footer');
        showRulesModal();
    }
};

// Clock
setInterval(() => {
    const now = new Date();
    if(document.getElementById('currentTime')) document.getElementById('currentTime').value = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    if(document.getElementById('currentDate')) document.getElementById('currentDate').value = now.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}, 1000);

// --- AUTHENTICATION ---
function manualLogin() {
    const idInput = document.getElementById('loginId').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(idInput)) { Swal.fire('Format ผิด', 'รหัสต้องมี 6 หลัก', 'warning'); return; }
    performLogin(idInput);
}

async function performLogin(userId) {
    showLoading(true);
    const res = await callApi('login', { userId: userId });
    showLoading(false);

    if (res.success) {
        localStorage.setItem('SALES_APP_USER_ID', res.data.id);
        CURRENT_USER = res.data;
        setupApp();
    } else {
        localStorage.removeItem('SALES_APP_USER_ID');
        Swal.fire('ไม่พบข้อมูล', res.message || 'รหัสไม่ถูกต้อง', 'error');
    }
}

function logout() {
    Swal.fire({
        title: 'ยืนยันออกจากระบบ?', icon: 'warning',
        showCancelButton: true, confirmButtonText: 'ใช่', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#dc3545'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('SALES_APP_USER_ID');
            location.reload();
        }
    });
}

// --- APP NAVIGATION & SETUP ---
function setupApp() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    document.querySelector('.app-header').classList.add('hidden'); 
    document.getElementById('mainFooter').classList.remove('login-footer');

    // Fill UI
    ['form', 'hist'].forEach(prefix => {
        document.getElementById(`${prefix}ProfilePic`).src = CURRENT_USER.pic;
        document.getElementById(`${prefix}Name`).innerText = CURRENT_USER.name;
        document.getElementById(`${prefix}Id`).innerText = CURRENT_USER.id;
        document.getElementById(`${prefix}Status`).innerText = CURRENT_USER.status;
    });
    
    document.getElementById('userId').value = CURRENT_USER.id;
    document.getElementById('userName').value = CURRENT_USER.name;
    document.getElementById('displayUserName').value = CURRENT_USER.name;

    getLocation();
}

function switchTab(tab) {
    if(tab === 'form') {
        document.getElementById('formView').classList.remove('hidden'); document.getElementById('historyView').classList.add('hidden');
        document.getElementById('navForm').classList.add('active'); document.getElementById('navHistory').classList.remove('active');
    } else {
        document.getElementById('formView').classList.add('hidden'); document.getElementById('historyView').classList.remove('hidden');
        document.getElementById('navForm').classList.remove('active'); document.getElementById('navHistory').classList.add('active');
        loadHistoryData();
    }
}

// --- FORM HANDLING ---
function getLocation() {
    const status = document.getElementById('locationStatus');
    status.innerHTML = '<span class="text-warning"><i class="bi bi-hourglass-split"></i> กำลังค้นหาพิกัด...</span>';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                document.getElementById('lat').value = pos.coords.latitude;
                document.getElementById('long').value = pos.coords.longitude;
                status.innerHTML = `<span class="loc-ok"><i class="bi bi-check-circle-fill"></i> ระบุตำแหน่งสำเร็จ</span>`;
            },
            () => { status.innerHTML = '<span class="loc-err"><i class="bi bi-x-circle-fill"></i> ไม่สามารถระบุพิกัดได้</span>'; },
            { enableHighAccuracy: true } 
        );
    } else { status.innerHTML = '<span class="loc-err">Browser ไม่รองรับ GPS</span>'; }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    if(!document.getElementById('lat').value) { Swal.fire('แจ้งเตือน', 'กรุณาระบุตำแหน่ง GPS', 'warning'); getLocation(); return; }
    const fileInput = document.getElementById('evidenceImg');
    if (fileInput.files.length === 0) { Swal.fire('แจ้งเตือน', 'กรุณาถ่ายภาพหลักฐาน', 'warning'); return; }
    const selectedSalesType = document.querySelector('input[name="salesTypeRadio"]:checked')?.value;
    
    showLoading(true); 
    try {
        const file = fileInput.files[0];
        const compressedBase64 = await compressImage(file);
        const formData = {
            userName: CURRENT_USER.name, salesType: selectedSalesType,
            lat: document.getElementById('lat').value, long: document.getElementById('long').value,
            imageFile: { name: file.name, mimeType: "image/jpeg", data: compressedBase64 }
        };
        
        const res = await callApi('submit', { userId: CURRENT_USER.id, formData: formData });
        
        showLoading(false);
        if (res.success) {
            Swal.fire({ title: 'สำเร็จ', text: res.message, icon: 'success', confirmButtonColor: '#0d6efd' }).then(() => {
                document.getElementById('salesForm').reset(); updateFileName(document.getElementById('evidenceImg'));
                document.getElementById('displayUserName').value = CURRENT_USER.name;
                getLocation(); switchTab('history');
            });
        } else { Swal.fire('บันทึกไม่สำเร็จ', res.message, 'error'); }

    } catch (error) { 
        showLoading(false); Swal.fire('เกิดข้อผิดพลาด', 'Client Error: ' + error.toString(), 'error'); 
    }
}

// --- HISTORY HANDLING ---
async function loadHistoryData() {
    showLoading(true);
    const res = await callApi('history', { userId: CURRENT_USER.id });
    showLoading(false);
    if (res.success) {
        ALL_HISTORY = res.history;
        renderFilteredHistory();
    }
}

function changeFilter(type) {
    CURRENT_FILTER = type; DISPLAY_LIMIT = 7;
    document.querySelectorAll('.filter-btn-group .btn').forEach(btn => btn.classList.remove('active'));
    if(type === 'week') document.getElementById('btnWeek').classList.add('active');
    if(type === 'month') document.getElementById('btnMonth').classList.add('active');
    if(type === 'year') document.getElementById('btnYear').classList.add('active');
    renderFilteredHistory();
}

function onMonthChange(select) { FILTER_MONTH_IDX = parseInt(select.value); renderFilteredHistory(); }
function onYearChange(select) { FILTER_YEAR_VAL = parseInt(select.value); renderFilteredHistory(); }

function renderFilteredHistory() {
    const now = new Date();
    let filtered = ALL_HISTORY.filter(item => {
        const d = new Date(item.timestamp);
        if (CURRENT_FILTER === 'week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); startOfWeek.setHours(0,0,0,0);
            return d >= startOfWeek;
        } else if (CURRENT_FILTER === 'month') {
            return d.getMonth() === FILTER_MONTH_IDX && d.getFullYear() === FILTER_YEAR_VAL;
        } else if (CURRENT_FILTER === 'year') {
            return d.getFullYear() === FILTER_YEAR_VAL;
        }
        return true;
    });
    updateDashboard(filtered); renderList(filtered);
}

function updateDashboard(data) {
    const box = document.getElementById('dashboardSummary');
    const now = new Date();
    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    let titleHtml = "", sub = "";

    if (CURRENT_FILTER === 'week') {
        const weekNum = Math.ceil(now.getDate() / 7);
        titleHtml = `<span class="dash-title">สัปดาห์ที่ ${weekNum} ของเดือนปัจจุบัน</span>`;
        sub = "ยอดส่งงานสัปดาห์นี้";
    } else if (CURRENT_FILTER === 'month') {
        let options = monthNames.map((m, i) => `<option value="${i}" ${i === FILTER_MONTH_IDX ? 'selected' : ''} style="color:black">${m}</option>`).join('');
        titleHtml = `<select class="dash-select" onchange="onMonthChange(this)">${options}</select> ${FILTER_YEAR_VAL + 543}`;
        sub = "ยอดส่งงานรายเดือน";
    } else {
        let years = [...new Set(ALL_HISTORY.map(h => new Date(h.timestamp).getFullYear()))].sort((a,b)=>b-a);
        if(!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear());
        let options = years.map(y => `<option value="${y}" ${y === FILTER_YEAR_VAL ? 'selected' : ''} style="color:black">ปี พ.ศ. ${y + 543}</option>`).join('');
        titleHtml = `<select class="dash-select" onchange="onYearChange(this)">${options}</select>`;
        sub = "ยอดรวมทั้งปี";
    }
    box.innerHTML = `<div style="display:flex; justify-content:center; align-items:center">${titleHtml} <i class="bi bi-caret-down-fill ms-1" style="font-size:0.7rem; opacity:0.8"></i></div><div class="dash-value">${data.length} <span style='font-size:1rem'>รายการ</span></div><div class="dash-sub">${sub}</div>`;
}

function renderList(data) {
    const container = document.getElementById('historyAccordion'); container.innerHTML = '';
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (data.length === 0) { container.innerHTML = '<div class="text-center text-muted mt-4">ไม่พบประวัติการส่งงาน</div>'; loadMoreBtn.classList.add('hidden'); return; }
    
    const visibleData = data.slice(0, DISPLAY_LIMIT);
    visibleData.forEach((item, index) => {
        const uniqueId = `flush-collapse-${index}`; const headerId = `flush-heading-${index}`;
        const html = `
          <div class="accordion-item">
            <h2 class="accordion-header" id="${headerId}">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${uniqueId}">
                <div class="w-100"><span class="hist-date"><i class="bi bi-calendar-check me-1"></i> ${item.date} | ${item.time}</span><div class="hist-type">${item.type}</div></div>
              </button>
            </h2>
            <div id="${uniqueId}" class="accordion-collapse collapse" data-bs-parent="#historyAccordion">
              <div class="accordion-body"><img src="${item.image}" class="evidence-preview mb-2"><div class="text-muted small">หลักฐานการส่งงาน</div></div>
            </div>
          </div>`;
        container.innerHTML += html;
    });
    if (data.length > DISPLAY_LIMIT) loadMoreBtn.classList.remove('hidden'); else loadMoreBtn.classList.add('hidden');
}

function loadMoreItems() { DISPLAY_LIMIT += 7; renderFilteredHistory(); }