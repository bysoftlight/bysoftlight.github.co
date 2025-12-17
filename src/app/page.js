'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { callApi } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check local storage
    const savedId = localStorage.getItem('SALES_APP_USER_ID');
    if (savedId) {
      performLogin(savedId);
    } else {
      // Show Rules Modal using Bootstrap JS logic (needs delay for DOM)
      setTimeout(() => {
        if (window.bootstrap) {
          const modal = new window.bootstrap.Modal(document.getElementById('rulesModal'), { backdrop: 'static', keyboard: false });
          modal.show();
        }
      }, 1000);
    }
  }, []);

  const performLogin = async (id) => {
    setLoading(true);
    const res = await callApi('login', { userId: id });
    setLoading(false);

    if (res.success) {
      localStorage.setItem('SALES_APP_USER_ID', res.data.id);
      localStorage.setItem('CURRENT_USER', JSON.stringify(res.data));
      router.push('/dashboard');
    } else {
      localStorage.removeItem('SALES_APP_USER_ID');
      if (window.Swal) window.Swal.fire('ไม่พบข้อมูล', 'รหัสไม่ถูกต้อง', 'error');
    }
  };

  const handleManualLogin = () => {
    if (!/^[A-Z0-9]{6}$/.test(loginId.toUpperCase())) {
      if (window.Swal) window.Swal.fire('Format ผิด', 'รหัสต้องมี 6 หลัก', 'warning');
      return;
    }
    performLogin(loginId.toUpperCase());
  };

  return (
    <>
      {loading && (
        <div id="loading" className="loading-overlay">
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-3 text-primary fw-bold">กำลังประมวลผล...</span>
        </div>
      )}

      {/* Rules Modal */}
      <div className="modal fade" id="rulesModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered">
          <div className="modal-content" style={{borderRadius: '20px'}}>
            <div className="modal-header bg-warning bg-opacity-10" style={{borderTopLeftRadius: '20px', borderTopRightRadius: '20px'}}>
              <h5 className="modal-title text-dark fw-bold" style={{fontSize: '1.1rem'}}><i className="bi bi-exclamation-triangle-fill text-warning me-2"></i> ข้อปฏิบัติในการใช้สิทธิ์มาตรา 35</h5>
            </div>
            <div className="modal-body rules-content p-4">
               {/* ใส่เนื้อหากฎระเบียบฉบับเต็มที่นี่ (Copy จาก HTML เดิม) */}
               <h6 className="fw-bold mb-3">ประเภทการจัดสถานที่จำหน่ายสินค้าหรือบริการ</h6>
               <ol className="ps-3 mb-0">
                 <li>ผู้ใช้สิทธิ์ ต้องส่งข้อมูลเข้าห้องรายงาน ใน Application WIX... (รายละเอียดเต็ม)</li>
                 <li>หากผู้พิการ เสียชีวิตลง... <strong>หากไม่ปฏิบัติตามผู้ดูแลต้องชดใช้...</strong></li>
                 <li>ห้ามทำผิดกฎหมาย <strong>(ฝ่าฝืนปรับตามสัญญา และตัดสิทธิ์)</strong></li>
               </ol>
            </div>
            <div className="modal-footer border-0 pt-0 pb-4 px-4">
              <button type="button" className="btn btn-primary w-100 rounded-pill py-2 fw-bold" data-bs-dismiss="modal">รับทราบและดำเนินการต่อ</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="card main-card">
          <div className="text-center mb-4"><h4 className="fw-bold text-primary">ส่วนที่ 1: เข้าสู่ระบบ</h4></div>
          <div className="mb-4">
            <label className="form-label text-center w-100 mb-3">กรอกรหัสผู้ใช้สิทธิ์ <span className="required-star">*</span></label>
            <input 
              type="text" 
              className="form-control form-control-rounded text-center text-uppercase" 
              style={{fontSize: '1.2rem', letterSpacing: '2px'}} 
              maxLength="6" 
              placeholder="XXXXXX"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
          </div>
          <button onClick={handleManualLogin} className="btn btn-primary w-100 rounded-pill py-3 fw-bold">ตรวจสอบข้อมูล</button>
          <div className="text-center mt-3">
             <small className="text-muted cursor-pointer text-decoration-underline" onClick={() => {
                if (window.bootstrap) new window.bootstrap.Modal(document.getElementById('rulesModal')).show();
             }}>อ่านข้อปฏิบัติการใช้สิทธิ์</small>
          </div>
        </div>
      </div>

      {/* Login Footer (No margin bottom) */}
      <Footer isLogin={true} />
    </>
  );
}

// Components
const Footer = ({ isLogin }) => {
  const showModal = (id) => {
    if (window.bootstrap) new window.bootstrap.Modal(document.getElementById(id)).show();
  };

  return (
    <>
      <footer className={`footer ${isLogin ? 'login-footer' : ''}`} id="mainFooter">
        <div className="container text-center">
          <div className="footer-logo">H</div>
          <ul className="footer-links" style={{display: 'flex', justifyContent: 'center', gap: '15px', padding: 0, listStyle: 'none', flexWrap: 'wrap'}}>
            <li><a onClick={() => showModal('aboutModal')}>เกี่ยวกับระบบ</a></li>
            <li>|</li>
            <li><a onClick={() => showModal('howtoModal')}>วิธีการใช้งาน</a></li>
            <li>|</li>
            <li><a onClick={() => showModal('privacyModal')}>นโยบายความเป็นส่วนตัว</a></li>
          </ul>
          <p className="copyright">© 2026 TUBE™ Creative Group. All right reserved.</p>
        </div>
      </footer>

      {/* Info Modals */}
      <div className="modal fade" id="aboutModal" tabIndex="-1"><div className="modal-dialog modal-dialog-centered"><div className="modal-content" style={{borderRadius: '20px', padding: '20px'}}><div className="modal-body text-center"><div className="info-modal-icon bg-primary"><i className="bi bi-info-circle"></i></div><h4 className="info-modal-title">เกี่ยวกับระบบ</h4><p>ระบบ HR Paper Mill พัฒนาขึ้นเพื่ออำนวยความสะดวก...</p></div></div></div></div>
      <div className="modal fade" id="howtoModal" tabIndex="-1"><div className="modal-dialog modal-dialog-centered"><div className="modal-content" style={{borderRadius: '20px', padding: '20px'}}><div className="modal-body"><div className="info-modal-icon bg-success"><i className="bi bi-journal-text"></i></div><h4 className="info-modal-title">วิธีการใช้งาน</h4><ul className="info-list"><li>ส่งงาน...</li></ul></div></div></div></div>
      <div className="modal fade" id="privacyModal" tabIndex="-1"><div className="modal-dialog modal-dialog-centered"><div className="modal-content" style={{borderRadius: '20px', padding: '20px'}}><div className="modal-body"><div className="info-modal-icon bg-secondary"><i className="bi bi-shield-lock"></i></div><h4 className="info-modal-title">นโยบายความเป็นส่วนตัว</h4><ul className="info-list"><li>เก็บข้อมูล GPS...</li></ul></div></div></div></div>
    </>
  );
};
