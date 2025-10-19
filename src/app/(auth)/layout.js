// Lokasi: src/app/(auth)/layout.js

export default function AuthLayout({ children }) {
  return (
    <html lang="id">
      {/* Pastikan teks hitam (default) di latar belakang putih */}
      <body className="bg-white"> 
        <main className="flex min-h-screen items-center justify-center">
          {children}
        </main>
      </body>
    </html>
  );
}