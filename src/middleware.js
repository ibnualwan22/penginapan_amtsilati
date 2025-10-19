// Lokasi: src/middleware.js

// Impor 'default' dari next-auth/middleware
export { default } from 'next-auth/middleware';

// Konfigurasi rute yang ingin Anda lindungi
export const config = {
  matcher: [
    '/admin', // Melindungi halaman dashboard utama
    '/admin/:path*', // Melindungi SEMUA sub-halaman (misal: /admin/users, /admin/kamar)
  ],
};