// Lokasi: src/app/admin/components/Header.js
import LogoutButton from './LogoutButton';

// Terima 'user' sebagai prop
export default function Header({ user }) {
  return (
    <header className="bg-white shadow p-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-black">
            Selamat Datang, {user?.name || 'Admin'}
          </h1>
          <p className="text-sm text-gray-600">
            Anda login sebagai {user?.role || 'User'}
          </p>
        </div>
        
        {/* Masukkan tombol logout di sini */}
        <LogoutButton />
      </div>
    </header>
  );
}