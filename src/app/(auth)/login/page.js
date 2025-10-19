// Lokasi: src/app/(auth)/login/page.js
'use client'; // <-- WAJIB: Menandakan ini adalah Client Component

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // <-- Import fungsi signIn
import { useRouter } from 'next/navigation'; // <-- Import untuk redirect

export default function LoginPage() {
  // State untuk menyimpan input form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // State untuk menampilkan pesan error
  const [error, setError] = useState(null);
  
  // State untuk loading (menonaktifkan tombol saat proses)
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter(); // Hook untuk mengarahkan (redirect) user

  // Fungsi yang dipanggil saat form di-submit
  const handleSubmit = async (event) => {
    event.preventDefault(); // Mencegah form refresh halaman
    setIsLoading(true);
    setError(null); // Bersihkan error sebelumnya

    try {
      // Memanggil fungsi signIn dari NextAuth
      const result = await signIn('credentials', {
        // 'credentials' adalah nama provider yang kita atur di route.js
        username: username,
        password: password,
        redirect: false, // <-- PENTING: Jangan redirect otomatis
      });

      if (result.error) {
        // Jika NextAuth mengembalikan error (cth: password salah)
        setError('Username atau password salah.');
        setIsLoading(false);
      } else if (result.ok) {
        // Jika login berhasil
        // Arahkan user ke halaman admin
        router.push('/admin');
      }
    } catch (err) {
      // Jika terjadi error tak terduga
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-lg border">
      <h2 className="text-3xl font-semibold text-center mb-6 text-black">
        Login Admin
      </h2>
      
      {/* Tempat untuk menampilkan pesan error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="username" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          />
        </div>
        
        <div className="mb-6">
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading} // Tombol mati saat loading
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}