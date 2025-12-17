// js/utils.js

// ฟังก์ชันย่อรูป
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const maxWidth = 1024; const quality = 0.6;
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                let width = img.width; let height = img.height;
                if (width > height) { if (width > maxWidth) { height = Math.round((height *= maxWidth / width)); width = maxWidth; } }
                else { if (height > maxWidth) { width = Math.round((width *= maxWidth / height)); height = maxWidth; } }
                const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

// อัปเดตชื่อไฟล์หน้าเว็บ
function updateFileName(input) {
    const label = document.getElementById('uploadBtnLabel');
    const display = document.getElementById('fileNameDisplay');
    if (input.files && input.files.length > 0) {
        label.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i> ภาพถูกเลือกแล้ว`;
        label.classList.remove('btn-outline-primary'); label.classList.add('btn-success', 'text-white');
        display.innerText = `ไฟล์: ${input.files[0].name}`;
    } else {
        label.innerHTML = `<i class="bi bi-camera-fill me-2"></i> ถ่ายภาพ / เลือกรูป`;
        label.classList.add('btn-outline-primary'); label.classList.remove('btn-success', 'text-white');
        display.innerText = 'Max: 2 MB';
    }
}

// Loading Spinner
function showLoading(show) { 
    document.getElementById('loading').style.display = show ? 'flex' : 'none'; 
}

// Modal Helpers
function showRulesModal() { new bootstrap.Modal(document.getElementById('rulesModal'), { backdrop: 'static', keyboard: false }).show(); }
function showModal(id) { new bootstrap.Modal(document.getElementById(id)).show(); }