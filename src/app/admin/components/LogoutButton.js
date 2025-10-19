// Lokasi: src/app/admin/components/LogoutButton.js
'use client'; // <-- WAJIB: Ini adalah Client Component

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  
  const handleLogout = () => {
    signOut({
      // Arahkan user ke halaman login setelah logout
      callbackUrl: '/login', 
    });
  };
  
  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
    >
      Logout
    </button>
  );
}