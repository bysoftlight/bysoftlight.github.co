'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { callApi } from '../../lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('form');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State for Form
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [locationStatus, setLocationStatus] = useState('กำลังระบุพิกัด...');
  const [lat, setLat] = useState('');
  const [long, setLong] = useState('');
  const [salesType, setSalesType] = useState('ทำการขายด้วยตัวเอง');
  const [file, setFile] = useState(null);
  const [fileLabel, setFileLabel] = useState('ถ่ายภาพ / เลือกรูป');

  // State for History
  const [history, setHistory] = useState([]);
  const [filterType, setFilterType] = useState('week'); // week, month, year
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [displayLimit, setDisplayLimit] = useState(7);

  useEffect(() => {
    const userData = localStorage.getItem('CURRENT_USER');
    if (!userData) {
      router.push('/');
    } else {
      setUser(JSON.parse(userData));
      getLocation(); // Get location on load
    }

    // Time Update
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --- Location Logic ---
  const getLocation = () => {
    setLocationStatus('กำลังค้นหาพิกัด...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLong(pos.coords.longitude);
          setLocationStatus(`ระบุตำแหน่งสำเร็จ (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        () => setLocationStatus('ไม่สามารถระบุพิกัดได้ (กรุณาเปิด GPS)'),
        { enableHighAccuracy: true }
      );
    } else {
      setLocationStatus('Browser ไม่รองรับ GPS');
    }
  };

  // --- Image Compression ---
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const maxWidth = 1024; const quality = 0.6;
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => {
          let width = img.width; let height = img.height;
          if (width > height) { if (width > maxWidth) { height = Math.round((height *= maxWidth / width)); width = maxWidth; } }
          else { if (height > maxWidth) { width = Math.round((width *= maxWidth / height)); height = maxWidth; } } // Fix logic for portrait
          const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
        };
      };
    });
  };

  // --- Submit Form ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lat) { window.Swal.fire('แจ้งเตือน', 'กรุณาระบุตำแหน่ง GPS', 'warning'); getLocation(); return; }
    if (!file) { window.Swal.fire('แจ้งเตือน', 'กรุณาถ่ายภาพหลักฐาน', 'warning'); return; }

    setLoading(true);
    try {
      const base64 = await compressImage(file);
      const formData = {
        userId: user.id, userName: user.name, salesType, lat, long,
        imageFile: { name: file.name, mimeType: 'image/jpeg', data: base64 }
      };
      
      const res = await callApi('submit', { userId: user.id, formData });
      if (res.success) {
        window.Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success').then(() => {
          setFile(null); setFileLabel('ถ่ายภาพ / เลือกรูป');
          setActiveTab('history');
          loadHistory(); // Reload history
        });
      } else {
        window.Swal.fire('Error', res.message, 'error');
      }
    } catch (err) { window.Swal.fire('Error', 'Upload Failed', 'error'); }
    setLoading(false);
  };

  // --- History Logic ---
  const loadHistory = async () => {
    setLoading(true);
    const res = await callApi('history', { userId: user.id });
    if (res.success) {
      setHistory(res.history);
    }
    setLoading(false);
  };

  // Handle Tab Switch
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') loadHistory();
  };

  // Render Filtered History
  const getFilteredHistory = () => {
    return history.filter(item => {
      const d = new Date(item.timestamp);
      if (filterType === 'week') {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0,0,0,0);
        return d >= startOfWeek;
      } else if (filterType === 'month') {
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      } else if (filterType === 'year') {
        return d.getFullYear() === filterYear;
      }
      return true;
    });
  };

  const filteredData = getFilteredHistory();
  const visibleData = filteredData.slice(0, displayLimit);

  if (!user) return null;

  return (
    <>
      {loading && (
        <div className="loading-overlay" style={{display: 'flex'}}>
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      )}

      <div className="container">
        {/* Profile Card (Shared) */}
        <div className="card main-card mb-4">
           <h5 className="text-center fw-bold mb-4">ข้อมูลของฉัน</h5>
           <div className="profile-section">
             <img src={user.pic} className="profile-img-center" alt="Profile" />
             <div className="profile-row"><span className="profile-label">ชื่อ-สกุล:</span><span className="profile-value">{user.name}</span></div>
             <div className="profile-row"><span className="profile-label">รหัสผู้ใช้สิทธิ์:</span><span className="profile-value">{user.id}</span></div>
             <div className="profile-row"><span className="profile-label">การใช้สิทธิ์:</span><span className="profile-value">{user.status}</span></div>
             {activeTab === 'form' && <p className="info-note">กรุณาตรวจสอบข้อมูลของท่านให้เรียบร้อย ก่อนดำเนินการในส่วนถัดไป</p>}
           </div>
        </div>

        {/* --- FORM VIEW --- */}
        <div className={activeTab === 'form' ? '' : 'hidden'}>
          <div className="card main-card">
            <h5 className="fw-bold text-primary mb-4">ส่วนที่ 2: ส่งหลักฐานการขาย</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                 <label className="form-label text-muted small ms-2 mb-1">ชื่อผู้ใช้สิทธิ์</label>
                 <input type="text" className="form-control form-control-rounded bg-white border-0 ps-3 fw-bold text-primary shadow-sm" disabled value={user.name} />
              </div>

              <div className="row g-3 mb-3">
                 <div className="col-12 col-md-6">
                   <label className="form-label text-muted small ms-2 mb-1">วันที่ปัจจุบัน</label>
                   <div className="input-group">
                     <span className="input-group-text bg-white border-end-0 text-primary ps-3" style={{borderRadius: '50px 0 0 50px'}}><i className="bi bi-calendar-event"></i></span>
                     <input type="text" className="form-control form-control-rounded border-start-0 bg-white ps-0" disabled value={currentDate} style={{borderRadius: '0 50px 50px 0'}} />
                   </div>
                 </div>
                 <div className="col-12 col-md-6">
                    <label className="form-label text-muted small ms-2 mb-1">เวลาปัจจุบัน</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-primary ps-3" style={{borderRadius: '50px 0 0 50px'}}><i className="bi bi-clock"></i></span>
                      <input type="text" className="form-control form-control-rounded border-start-0 bg-white ps-0" disabled value={currentTime} style={{borderRadius: '0 50px 50px 0'}} />
                    </div>
                 </div>
              </div>

              <div className="location-card">
                  <div className="loc-title"><i className="bi bi-geo-alt-fill loc-icon"></i> ตำแหน่งของคุณ</div>
                  <div className="mb-2" style={{fontSize: '1rem', color: '#555'}}>{locationStatus}</div>
                  <button type="button" className="btn-refresh" onClick={getLocation}><i className="bi bi-arrow-clockwise"></i> รีเฟรชตำแหน่ง</button>
                  <div className="gps-note">
                     <div className="d-flex align-items-start">
                        <i className="bi bi-info-circle-fill me-2 mt-1"></i>
                        <div><strong>หมายเหตุ:</strong><br/>ระบบจะบันทึกตำแหน่ง GPS ของคุณโดยอัตโนมัติ เพื่อยืนยันสถานที่จำหน่ายสินค้า</div>
                     </div>
                  </div>
              </div>

              <div className="mb-4 mt-4">
                <label className="form-label">ประเภทการขาย <span className="required-star">*</span></label>
                <div className="d-flex flex-column ps-3 gap-2">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="salesType" id="saleSelf" checked={salesType === 'ทำการขายด้วยตัวเอง'} onChange={() => setSalesType('ทำการขายด้วยตัวเอง')} />
                    <label className="form-check-label" htmlFor="saleSelf">ทำการขายด้วยตัวเอง</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="salesType" id="saleAgent" checked={salesType === 'ทำการขายโดยตัวแทน'} onChange={() => setSalesType('ทำการขายโดยตัวแทน')} />
                    <label className="form-check-label" htmlFor="saleAgent">ทำการขายโดยตัวแทน</label>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="form-label">ถ่ายภาพหลักฐาน <span className="required-star">*</span></label>
                <input type="file" id="evidenceImg" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                    if (e.target.files[0]) {
                        setFile(e.target.files[0]);
                        setFileLabel('เลือกรูปภาพแล้ว');
                    }
                }} />
                <label htmlFor="evidenceImg" className={`btn-upload ${file ? 'btn-success text-white' : ''}`}>
                    <i className={`bi ${file ? 'bi-check-circle-fill' : 'bi-camera-fill'} me-2`}></i> {fileLabel}
                </label>
              </div>

              <button type="submit" className="btn btn-submit-gray w-100 py-3">
                <i className="bi bi-rocket-takeoff-fill me-2"></i> บันทึกข้อมูล
              </button>
            </form>
            
            {/* Rules Toggle (Simplified) */}
            <div className="accordion accordion-flush mt-4 pt-3 border-top">
                <div className="accordion-item">
                    <h2 className="accordion-header">
                        <button className="accordion-button collapsed text-muted" type="button" data-bs-toggle="collapse" data-bs-target="#collapseRules">
                            <small><i className="bi bi-info-circle me-2"></i> ทบทวนข้อปฏิบัติการใช้สิทธิ์</small>
                        </button>
                    </h2>
                    <div id="collapseRules" className="accordion-collapse collapse">
                        <div className="accordion-body rules-content bg-light rounded mt-2">
                            <h6 className="fw-bold mb-3">ประเภทการจัดสถานที่จำหน่ายสินค้าหรือบริการ</h6>
                            <ol className="ps-3 mb-0"><li>ผู้ใช้สิทธิ์ ต้องส่งข้อมูล...</li></ol>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* --- HISTORY VIEW --- */}
        <div className={activeTab === 'history' ? '' : 'hidden'}>
            <div className="d-flex justify-content-center gap-2 mb-3 filter-btn-group">
              <button onClick={() => setFilterType('week')} className={`btn btn-outline-primary ${filterType === 'week' ? 'active' : ''}`}>รายสัปดาห์</button>
              <button onClick={() => setFilterType('month')} className={`btn btn-outline-primary ${filterType === 'month' ? 'active' : ''}`}>รายเดือน</button>
              <button onClick={() => setFilterType('year')} className={`btn btn-outline-primary ${filterType === 'year' ? 'active' : ''}`}>รายปี</button>
            </div>

            <div className="dashboard-box">
                {/* Dashboard Logic */}
                {filterType === 'week' && <div className="dash-title">สัปดาห์ปัจจุบัน</div>}
                {filterType === 'month' && (
                    <div className="d-flex justify-content-center align-items-center">
                        <select className="dash-select" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
                            {["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"].map((m, i) => <option key={i} value={i} style={{color:'black'}}>{m}</option>)}
                        </select>
                        <span className="ms-2">{filterYear + 543}</span>
                    </div>
                )}
                {filterType === 'year' && (
                    <select className="dash-select" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y} style={{color:'black'}}>ปี พ.ศ. {y + 543}</option>)}
                    </select>
                )}
                
                <div className="dash-value">{filteredData.length} <span style={{fontSize:'1rem'}}>รายการ</span></div>
                <div className="dash-sub">ยอดส่งงานรวม</div>
            </div>

            <div className="accordion accordion-flush mb-4">
                {visibleData.map((item, index) => (
                    <div className="accordion-item" key={index}>
                        <h2 className="accordion-header" id={`heading-${index}`}>
                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${index}`}>
                                <div className="w-100">
                                    <span className="hist-date"><i className="bi bi-calendar-check me-1"></i> {item.date} | {item.time}</span>
                                    <div className="hist-type">{item.type}</div>
                                </div>
                            </button>
                        </h2>
                        <div id={`collapse-${index}`} className="accordion-collapse collapse" data-bs-parent="#historyAccordion">
                            <div className="accordion-body">
                                <img src={item.image} className="evidence-preview mb-2" alt="evidence" />
                                <div className="text-muted small">หลักฐานการส่งงาน</div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredData.length === 0 && <div className="text-center text-muted">ไม่พบข้อมูล</div>}
            </div>
            
            {filteredData.length > displayLimit && (
                <button onClick={() => setDisplayLimit(prev => prev + 7)} className="btn btn-light w-100 mb-4 text-muted">โหลดเพิ่มเติม <i className="bi bi-chevron-down"></i></button>
            )}

            <button onClick={() => { localStorage.removeItem('SALES_APP_USER_ID'); router.push('/'); }} className="btn btn-danger w-100 rounded-pill py-3 mb-4 fw-bold">ออกจากระบบ</button>
        </div>

        {/* Bottom Nav */}
        <div className="bottom-nav">
          <div className={`nav-item ${activeTab === 'form' ? 'active' : ''}`} onClick={() => switchTab('form')}>
            <i className="bi bi-plus-circle-fill nav-icon"></i><span>ส่งงาน</span>
          </div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => switchTab('history')}>
            <i className="bi bi-clock-history nav-icon"></i><span>ประวัติ</span>
          </div>
        </div>
      </div>

      <Footer isLogin={false} />
    </>
  );
}

// Reusing Footer Component in the same file for copy-paste simplicity
const Footer = ({ isLogin }) => {
    const showModal = (id) => { if (window.bootstrap) new window.bootstrap.Modal(document.getElementById(id)).show(); };
    return (
      <footer className={`footer ${isLogin ? 'login-footer' : ''}`} id="mainFooter">
        <div className="container text-center">
          <div className="footer-logo">H</div>
          <ul className="footer-links" style={{display: 'flex', justifyContent: 'center', gap: '15px', padding: 0, listStyle: 'none', flexWrap: 'wrap'}}>
            <li><a onClick={() => showModal('aboutModal')}>เกี่ยวกับระบบ</a></li><li>|</li>
            <li><a onClick={() => showModal('howtoModal')}>วิธีการใช้งาน</a></li><li>|</li>
            <li><a onClick={() => showModal('privacyModal')}>นโยบายความเป็นส่วนตัว</a></li>
          </ul>
          <p className="copyright">© 2026 TUBE™ Creative Group. All right reserved.</p>
        </div>
      </footer>
    );
};
