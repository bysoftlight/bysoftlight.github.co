import './globals.css';

export const metadata = {
  title: 'HR Paper Mill',
  description: 'Sales Recording System',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        {/* Bootstrap CSS */}
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
        {/* LINE Seed Font */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lazywasabi/thai-web-fonts@7/fonts/LineSeedSansTH/LineSeedSansTH.css" />
      </head>
      <body>
        <div className="content-wrapper">
          <div className="container mt-5 mb-3 app-header text-center">
            <h1>HR Paper Mill</h1>
            <h5>โครงการใช้สิทธิ์สัมปทานผู้พิการตามมาตรา 35 ประจำปี 2569</h5>
            <p className="mt-2">เว็บไซต์ HR Paper Mill v.26 (Next.js Edition)</p>
          </div>
          {children}
        </div>

        {/* Bootstrap JS Bundle & SweetAlert */}
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" async></script>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11" async></script>
      </body>
    </html>
  );
}
