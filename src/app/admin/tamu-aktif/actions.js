// Lokasi: src/app/admin/tamu-aktif/actions.js
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Aksi untuk memperpanjang durasi menginap
 */
export async function extendBooking(prevState, formData) {
  const bookingId = formData.get('bookingId');
  const newDuration = parseFloat(formData.get('newDuration'));
  const checkInTime = new Date(formData.get('checkInTime'));

  if (!bookingId || isNaN(newDuration) || newDuration <= 0) {
    return { success: false, message: 'Durasi baru tidak valid.' };
  }

  try {
    // Hitung ulang ekspektasi check-out
    const durationInMs = newDuration * 24 * 60 * 60 * 1000;
    const newExpectedCheckOutTime = new Date(checkInTime.getTime() + durationInMs);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        duration: newDuration,
        expectedCheckOutTime: newExpectedCheckOutTime,
      },
    });

    revalidatePath('/admin/tamu-aktif');
    return { success: true, message: 'Durasi berhasil diperpanjang.' };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Gagal memperbarui durasi.' };
  }
}

/**
 * Aksi untuk Check-Out Lebih Awal
 * 
 */
export async function prepareEarlyCheckOut(bookingId, checkInTime) {
  try {
    const checkIn = new Date(checkInTime);
    const now = new Date();

    // Hitung durasi aktual dalam milidetik
    const actualDurationMs = now.getTime() - checkIn.getTime();
    
    // Konversi ke hari (cth: 1.2 hari)
    const actualDurationInDays = actualDurationMs / (1000 * 60 * 60 * 24);

    // Bulatkan ke atas ke 0.5 hari terdekat (cth: 1.2 -> 1.5, 1.6 -> 2.0)
    // Ini agar sesuai dengan logika paket 1/2 harian
    const finalDuration = Math.ceil(actualDurationInDays * 2) / 2;
    
    // Update durasi booking menjadi durasi aktual
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        duration: finalDuration,
        // (expectedCheckOutTime biarkan, sbg catatan)
      },
    });

    revalidatePath('/admin/tamu-aktif');
    
  } catch (error) {
    console.error(error);
    // Gagal? Tetap redirect, kalkulasi akan pakai durasi asli
  }
  
  // Arahkan ke halaman check-out
  redirect(`/admin/check-out/${bookingId}`);
}