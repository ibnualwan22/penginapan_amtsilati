// Lokasi: src/app/admin/denda/actions.js
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// === AKSI 1: DENDA KETERLAMBATAN ===
// (Meng-update data di model RoomType)
export async function updateLateFineSettings(prevState, formData) {
  const roomTypeId = formData.get('roomTypeId');
  const lateFeePerHour = parseFloat(formData.get('lateFeePerHour'));
  const lateFeeHalfDay = parseFloat(formData.get('lateFeeHalfDay'));
  const lateFeeFullDay = parseFloat(formData.get('lateFeeFullDay'));

  if (!roomTypeId || isNaN(lateFeePerHour) || isNaN(lateFeeHalfDay) || isNaN(lateFeeFullDay)) {
    return { success: false, message: 'Semua data harga wajib diisi.' };
  }

  try {
    await prisma.roomType.update({
      where: { id: roomTypeId },
      data: {
        lateFeePerHour,
        lateFeeHalfDay,
        lateFeeFullDay,
      },
    });

    revalidatePath('/admin/denda');
    return { success: true, message: 'Pengaturan denda keterlambatan berhasil diperbarui.' };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}

// === AKSI 2: DENDA BARANG (CRUD) ===
// (Meng-update model FineItem)
export async function upsertFineItem(prevState, formData) {
  const id = formData.get('id'); // Null jika 'Create'
  const name = formData.get('name');
  const price = parseFloat(formData.get('price'));
  const propertyId = formData.get('propertyId');

  if (!name || isNaN(price) || !propertyId) {
    return { success: false, message: 'Nama item dan harga wajib diisi.' };
  }

  try {
    if (id) {
      // --- Proses EDIT ---
      await prisma.fineItem.update({
        where: { id: id },
        data: { name, price, propertyId },
      });
      revalidatePath('/admin/denda');
      return { success: true, message: 'Item denda berhasil diperbarui.' };
    } else {
      // --- Proses CREATE ---
      const existing = await prisma.fineItem.findFirst({
        where: { name, propertyId },
      });
      if (existing) {
        return { success: false, message: 'Nama item denda sudah ada.' };
      }

      await prisma.fineItem.create({
        data: { name, price, propertyId },
      });
      revalidatePath('/admin/denda');
      return { success: true, message: 'Item denda berhasil ditambahkan.' };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}

export async function deleteFineItem(id) {
  try {
    const usageCount = await prisma.appliedFineItem.count({
      where: { fineItemId: id },
    });

    if (usageCount > 0) {
      return { success: false, message: 'Gagal! Item ini sudah pernah tercatat di laporan booking.' };
    }

    await prisma.fineItem.delete({
      where: { id: id },
    });

    revalidatePath('/admin/denda');
    return { success: true, message: 'Item denda berhasil dihapus.' };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}