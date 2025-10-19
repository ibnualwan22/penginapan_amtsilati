// Lokasi: src/app/admin/components/Sidebar.js
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6 text-center">
        Penginapan
        <br />
        Amtsilati
      </h2>
      
      <nav>
        <ul>
          <li className="mb-2">
            <Link 
              href="/admin" 
              className="block py-2 px-3 rounded hover:bg-gray-700"
            >
              Dashboard
            </Link>
          </li>
          
          {/* Ini adalah placeholder untuk menu-menu kita nanti */}
          <li className="mb-2">
            <Link 
              href="/admin/kamar" 
              className="block py-2 px-3 rounded hover:bg-gray-700"
            >
              Manajemen Kamar
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/admin/tipe-kamar" 
              className="block py-2 px-3 rounded hover:bg-gray-700"
            >
              Manajemen Harga Kamar
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/admin/denda" 
              className="block py-2 px-3 rounded hover:bg-gray-700"
            >
              Manajemen Denda
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/admin/tamu-aktif" 
              className="block py-2 px-3 rounded hover:bg-gray-700"
            >
              Tamu Aktif
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/admin/laporan" 
              className="block py-2 px-3 rounded hover:bg-gray-700"
            >
              Laporan
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/admin/users" 
              className="block py-2 px-3 rounded hover:bg-gray-700"
            >
              Manajemen User
            </Link>
          </li>

        </ul>
      </nav>
    </aside>
  );
}