// Lokasi: src/app/api/auth/[...nextauth]/route.js

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma'; // Import koneksi prisma kita
import bcrypt from 'bcryptjs';

export const authOptions = {
  // 1. Gunakan Prisma Adapter
  adapter: PrismaAdapter(prisma),

  // 2. Konfigurasi Provider (Metode Login)
  providers: [
    CredentialsProvider({
      // Ini adalah 'key' internal, bukan nama form
      name: 'Credentials',
      
      // Ini mendefinisikan field apa yang kita harapkan dari form login
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      
      // 3. Logika Authorize (Pemeriksaan Login)
      async authorize(credentials) {
        // Jika username atau password tidak diisi
        if (!credentials.username || !credentials.password) {
          return null;
        }

        // Cari user di database
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { role: true } // Kita ambil data role-nya juga
        });

        // Jika user tidak ditemukan
        if (!user) {
          return null;
        }

        // Cek kecocokan password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        // Jika password tidak cocok
        if (!isPasswordValid) {
          return null;
        }

        // Jika user ditemukan DAN password cocok, kembalikan data user
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role.name, // Kirim nama role
          propertyId: user.propertyId, // Kirim ID properti
        };
      },
    }),
  ],

  // 4. Konfigurasi Session
  session: {
    strategy: 'jwt', // Gunakan JSON Web Tokens
  },

  // 5. Callbacks (Untuk memasukkan data custom ke token)
  callbacks: {
    // Callback 'jwt' dipanggil setiap kali token dibuat/diperbarui
    async jwt({ token, user }) {
      // Jika 'user' ada (saat login pertama kali), tambahkan data custom
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.propertyId = user.propertyId;
      }
      return token;
    },
    
    // Callback 'session' dipanggil setiap kali session diakses
    async session({ session, token }) {
      // Masukkan data dari token (hasil jwt callback) ke object session
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.propertyId = token.propertyId;
      }
      return session;
    },
  },

  // 6. Halaman Kustom
  pages: {
    signIn: '/login', // Arahkan ke halaman login kustom kita
    error: '/login', // Jika error (misal: password salah), kembali ke login
  },
};

// Ekspor handler NextAuth
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };