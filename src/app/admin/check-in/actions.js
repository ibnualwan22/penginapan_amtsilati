// Lokasi: src/app/admin/check-in/actions.js
'use server';

import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createBooking(prevState, formData) {
  // 1. Dapatkan Sesi User (Resepsionis)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Anda tidak terautentikasi.' };
  }
  const receptionistId = session.user.id;

  // 2. Ambil Data dari Form
  const data = Object.fromEntries(formData);

  // Data Wajib
  const roomId = data.roomId;
  const propertyId = data.propertyId;
  const guestName = data.guestName;
  const guestPhone = data.guestPhone;
  const guestAddress = data.guestAddress;
  const duration = parseFloat(data.duration); // Durasi (misal: 1.5 hari)

  if (!roomId || !propertyId || !guestName || !guestPhone || !guestAddress || isNaN(duration) || duration <= 0) {
    return { success: false, message: 'Data wajib (Nama, WA, Alamat, Durasi) harus diisi.' };
  }
  
  // Data Opsional (Santri)
  const santriName = data.includeSantri === 'on' ? data.santriName : null;
  const santriDetails = data.includeSantri === 'on' ? data.santriDetails : null;

  // Data Opsional (Berbayar)
  const isFree = data.isFree === 'true';
  const paymentMethod = data.paymentMethod || null;
  const paymentStatus = data.paymentStatus || null;
  const downPaymentAmount = data.paymentStatus === 'DOWN_PAYMENT' 
    ? parseFloat(data.downPaymentAmount) 
    : null;
    
  // 3. Hitung Waktu
  const checkInTime = new Date(); // Sekarang (WIB sudah di-handle di server)
  
  // Hitung ekspektasi checkout (Durasi dalam milidetik)
  const durationInMs = duration * 24 * 60 * 60 * 1000;
  const expectedCheckOutTime = new Date(checkInTime.getTime() + durationInMs);

  // 4. Proses Transaksi Database
  try {
    await prisma.$transaction(async (tx) => {
      // a. Kunci kamar yang dipilih
      const room = await tx.room.findUnique({
        where: { id: roomId },
      });

      // b. Pastikan kamar masih tersedia
      if (room.status !== 'AVAILABLE') {
        throw new Error('Kamar ini sudah terisi atau sedang diperbaiki.');
      }

      // c. Buat data booking baru
      await tx.booking.create({
        data: {
          isActive: true,
          guestName,
          guestPhone,
          guestAddress,
          santriName,
          santriDetails: santriDetails ? JSON.parse(santriDetails) : null,
          checkInTime,
          expectedCheckOutTime,
          duration: duration,
          paymentMethod: isFree ? null : paymentMethod,
          paymentStatus: isFree ? null : paymentStatus,
          downPaymentAmount: isFree ? null : downPaymentAmount,
          
          // Relasi
          propertyId: propertyId,
          roomId: roomId,
          checkInReceptionistId: receptionistId,
        },
      });

      // d. Update status kamar menjadi 'Terisi'
      await tx.room.update({
        where: { id: roomId },
        data: { status: 'OCCUPIED' },
      });
    });

  } catch (error) {
    console.error('Gagal check-in:', error);
    return { success: false, message: error.message || 'Gagal membuat booking.' };
  }

  // 5. Sukses: Bersihkan cache dan Redirect
  
  // (TODO: Kirim notifikasi WA ke tamu)
  
  revalidatePath('/admin'); // Update dashboard
  revalidatePath('/admin/kamar'); // Update daftar kamar
  
  // Kita redirect ke halaman Tamu Aktif (yang akan kita buat)
  // Untuk sekarang, redirect ke dashboard
  redirect('/admin'); 
}