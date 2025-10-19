// Lokasi: src/app/admin/layout.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Sesuaikan path ini
import { redirect } from 'next/navigation';
import Sidebar from './components/Sidebar'; // Import Sidebar
import Header from './components/Header'; // Import Header

export default async function DashboardLayout({ children }) {
  // 1. Dapatkan data sesi di server
  const session = await getServerSession(authOptions);

  // 2. Jika tidak ada sesi (user belum login), lempar ke halaman login
  // (Walaupun middleware sudah menangani, ini adalah lapisan keamanan ganda)
  if (!session) {
    redirect('/login');
  }

  // 3. Render layout jika user sudah login
  return (
    <html lang="id">
      <body>
        <div className="flex">
          
          {/* ----- SIDEBAR ----- */}
          <Sidebar />
          
          {/* ----- KONTEN UTAMA ----- */}
          <div className="flex-1">
            
            {/* ----- HEADER ----- */}
            {/* Kirim data user.role dan user.name ke Header */}
            <Header user={session.user} />
            
            {/* ----- Isi Halaman (page.js) ----- */}
            <main className="p-6 bg-gray-50 min-h-screen">
              {children}
            </main>

          </div>
        </div>
      </body>
    </html>
  );
}