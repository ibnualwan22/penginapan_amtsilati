// Lokasi: src/app/layout.js

import './globals.css';
import Providers from './providers'; // <-- 1. Import provider

export const metadata = {
  title: 'Penginapan Amtsilati',
  description: 'Sistem Manajemen Penginapan Amtsilati',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {/* 2. Bungkus {children} dengan <Providers> */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}