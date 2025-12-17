// js/config.js

// ฟังก์ชันถอดรหัส (อย่างง่าย) เพื่อใช้ภายในแอพ
const decode = (str) => decodeURIComponent(atob(str).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
}).join(''));

// 🔥 ใส่ค่าที่แปลงเป็น Base64 แล้วที่นี่ 🔥
const _E_URL = "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4dVVETFJFNFNWOEQ5bHgwTVVQMnQ3bDVXMW1hLWg1VFhTZllFdkZjX0ppdi1zVmljOVcxZkJ3bW96Vy1mOVpDeHgvZXhlYw=="; 
const _E_KEY = "TVlfU1VQRVJfU0VDUkVUX0tFWV8yMDI2";

// Export ค่าที่ถอดรหัสแล้วให้ไฟล์อื่นใช้
const CONFIG = {
    API_URL: decode(_E_URL),
    API_SECRET: decode(_E_KEY)
};