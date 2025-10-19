// Lokasi: src/app/admin/tipe-kamar/actions.js
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fungsi untuk membuat atau mengedit Tipe Kamar
// Kita gabungkan jadi satu fungsi (upsert)
export async function upsertRoomType(prevState, formData) {
  const id = formData.get('id'); // Akan null jika 'Create'
  const name = formData.get('name');
  const priceHalfDay = parseFloat(formData.get('priceHalfDay'));
  const priceFullDay = parseFloat(formData.get('priceFullDay'));
  const propertyId = formData.get('propertyId');

  if (!name || isNaN(priceHalfDay) || isNaN(priceFullDay) || !propertyId) {
    return { success: false, message: 'Semua data wajib diisi dengan benar.' };
  }

  try {
    if (id) {
      // --- Proses EDIT ---
      await prisma.roomType.update({
        where: { id: id },
        data: {
          name,
          priceHalfDay,
          priceFullDay,
          propertyId,
        },
      });
      revalidatePath('/admin/tipe-kamar');
      return { success: true, message: 'Tipe kamar berhasil diperbarui.' };

    } else {
      // --- Proses CREATE ---
      // Cek duplikasi nama
      const existing = await prisma.roomType.findFirst({
        where: { name, propertyId },
      });

      if (existing) {
        return { success: false, message: 'Nama tipe kamar sudah ada.' };
      }

      await prisma.roomType.create({
        data: {
          name,
          priceHalfDay,
          priceFullDay,
          propertyId,
        },
      });
      revalidatePath('/admin/tipe-kamar');
      return { success: true, message: 'Tipe kamar berhasil ditambahkan.' };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}

// Fungsi untuk menghapus Tipe Kamar
export async function deleteRoomType(id) {
  try {
    // Cek dulu apakah tipe kamar ini masih dipakai oleh kamar
    const roomCount = await prisma.room.count({
      where: { roomTypeId: id },
    });

    if (roomCount > 0) {
      return { success: false, message: 'Gagal! Tipe kamar masih digunakan oleh kamar lain.' };
    }

    // Jika aman, hapus
    await prisma.roomType.delete({
      where: { id: id },
    });

    revalidatePath('/admin/tipe-kamar');
    return { success: true, message: 'Tipe kamar berhasil dihapus.' };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}