// Lokasi: src/app/admin/kamar/actions.js
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache'; // Untuk bug-fix status

/**
 * Aksi untuk membuat (Create) ATAU memperbarui (Update) kamar.
 */
export async function upsertRoom(prevState, formData) {
  const id = formData.get('id'); // Akan ada jika mode Edit
  const roomNumber = formData.get('roomNumber');
  const propertyId = formData.get('propertyId');
  const roomTypeId = formData.get('roomTypeId') || null;

  if (!roomNumber || !propertyId) {
    return { success: false, message: 'Nomor Kamar dan Properti wajib diisi.' };
  }

  try {
    // Cek duplikasi nomor kamar di properti yang sama
    const existingRoom = await prisma.room.findFirst({
      where: {
        roomNumber: roomNumber,
        propertyId: propertyId,
        NOT: { id: id || undefined }, // Abaikan diri sendiri saat mode Edit
      },
    });

    if (existingRoom) {
      return { success: false, message: 'Nomor kamar sudah ada di properti ini.' };
    }

    if (id) {
      // --- MODE UPDATE ---
      await prisma.room.update({
        where: { id: id },
        data: {
          roomNumber: roomNumber,
          roomTypeId: roomTypeId,
        },
      });
      revalidatePath('/admin/kamar');
      return { success: true, message: 'Kamar berhasil diperbarui.' };

    } else {
      // --- MODE CREATE ---
      await prisma.room.create({
        data: {
          roomNumber: roomNumber,
          propertyId: propertyId,
          roomTypeId: roomTypeId,
          status: 'AVAILABLE', // Default saat dibuat
        },
      });
      revalidatePath('/admin/kamar');
      revalidatePath('/admin'); // Update statistik dashboard
      return { success: true, message: 'Kamar berhasil ditambahkan.' };
    }

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}

/**
 * Aksi untuk mengubah status kamar (dari dropdown)
 * Sekarang dengan pengaman!
 */
export async function updateRoomStatus(roomId, newStatus) {
  noStore(); // Pastikan kita selalu dapat data terbaru

  try {
    // BUG FIX: Cek dulu apakah ada booking aktif
    const activeBooking = await prisma.booking.findFirst({
      where: {
        roomId: roomId,
        isActive: true,
      },
    });

    if (activeBooking && newStatus !== 'OCCUPIED') {
      // JIKA ADA BOOKING AKTIF, JANGAN BIARKAN DIUBAH KE STATUS LAIN
      return { success: false, message: 'Gagal! Kamar ini sedang terisi oleh tamu.' };
    }

    // Jika aman, update status
    await prisma.room.update({
      where: { id: roomId },
      data: { status: newStatus },
    });

    revalidatePath('/admin/kamar');
    revalidatePath('/admin'); // Update statistik dashboard
    return { success: true, message: 'Status berhasil diperbarui.' };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Gagal memperbarui status.' };
  }
}

/**
 * Aksi untuk menghapus kamar
 */
export async function deleteRoom(roomId) {
  try {
    // Cek apakah kamar punya riwayat booking
    const bookingCount = await prisma.booking.count({
      where: { roomId: roomId },
    });

    if (bookingCount > 0) {
      return { success: false, message: 'Gagal! Kamar tidak bisa dihapus karena memiliki riwayat booking.' };
    }

    // Jika aman (tidak ada riwayat), hapus
    await prisma.room.delete({
      where: { id: roomId },
    });

    revalidatePath('/admin/kamar');
    revalidatePath('/admin');
    return { success: true, message: 'Kamar berhasil dihapus.' };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}