// Lokasi: src/app/admin/check-out/actions.js
'use server';

import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function finalizeCheckOut(prevState, formData) {
  // 1. Dapatkan Sesi User (Resepsionis)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Anda tidak terautentikasi.' };
  }
  const receptionistId = session.user.id;

  // 2. Ambil Data dari Form
  const bookingId = formData.get('bookingId');
  const roomId = formData.get('roomId');
  const finalPaymentStatus = formData.get('paymentStatus'); // Cth: 'PAID'
  
  // Data finansial
  const totalBasePrice = parseFloat(formData.get('totalBasePrice'));
  const totalLateFee = parseFloat(formData.get('totalLateFee'));
  const totalFineItemsAmount = parseFloat(formData.get('totalFineItemsAmount'));
  const grandTotal = parseFloat(formData.get('grandTotal'));
  
  const paymentMethod = formData.get('paymentMethod'); // <-- TAMBAHKAN INI
  // Data denda barang (dalam format JSON)
  const appliedFinesJSON = formData.get('appliedFinesJSON');
  const appliedFines = JSON.parse(appliedFinesJSON); // Cth: [{ id, name, price, quantity }]

  if (!bookingId || !roomId || !finalPaymentStatus) {
    return { success: false, message: 'Data tidak lengkap.' };
  }

  // 3. Waktu Check-Out (Sekarang)
  const actualCheckOutTime = new Date();

  // 4. Proses Transaksi Database
  try {
    await prisma.$transaction(async (tx) => {
      // a. Update Booking: Selesaikan booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          isActive: false, // <-- PENTING: Pindahkan ke riwayat
          actualCheckOutTime: actualCheckOutTime,
          paymentStatus: finalPaymentStatus,
          totalBasePrice: totalBasePrice,
          totalLateFee: totalLateFee,
          totalFineItemsAmount: totalFineItemsAmount,
          grandTotal: grandTotal,
          paymentMethod: paymentMethod, // <-- TAMBAHKAN INI
          checkOutReceptionistId: receptionistId, //
        },
      });

      // b. Catat semua denda barang yang diterapkan
      if (appliedFines.length > 0) {
        const finesToCreate = appliedFines.map(fine => ({
          bookingId: bookingId,
          fineItemId: fine.id,
          quantity: fine.quantity,
          priceAtTimeOfFine: fine.price, // Simpan harga saat denda
        }));
        
        await tx.appliedFineItem.createMany({
          data: finesToCreate,
        });
      }

      // c. Update Status Kamar
      // Sesuai rencana, status kembali ke "tersedia" atau "sedang dibersihkan"
      // Kita set ke 'MAINTENANCE' (Perbaikan/Dibersihkan)
      await tx.room.update({
        where: { id: roomId },
        data: { status: 'MAINTENANCE' }, //
      });
    });

  } catch (error) {
    console.error('Gagal check-out:', error);
    return { success: false, message: 'Gagal memfinalisasi check-out.' };
  }

  // 5. Sukses: Bersihkan cache dan Redirect
  revalidatePath('/admin'); // Update dashboard
  revalidatePath('/admin/tamu-aktif'); // Update daftar tamu
  revalidatePath('/admin/laporan'); // Update laporan (nanti)
  
  redirect('/admin/tamu-aktif'); 
}