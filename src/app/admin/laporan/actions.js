// Lokasi: src/app/admin/laporan/actions.js
'use server';

import prisma from '@/lib/prisma';

// Helper untuk konversi Decimal ke Number
function convertDecimals(obj) {
  if (!obj) return null;
  
  // JANGAN proses jika ini adalah objek Date
  if (obj instanceof Date) {
    return obj;
  }

  const newObj = { ...obj };
  for (const key in newObj) {
    if (newObj[key] && typeof newObj[key] === 'object' && typeof newObj[key].toNumber === 'function') {
      newObj[key] = newObj[key].toNumber();
    } else if (Array.isArray(newObj[key])) {
      newObj[key] = newObj[key].map(item => convertDecimals(item));
    } else if (typeof newObj[key] === 'object' && newObj[key] !== null && !(newObj[key] instanceof Date)) { 
      // <-- Tambahkan pengecualian '!(... instanceof Date)'
      newObj[key] = convertDecimals(newObj[key]);
    }
  }
  return newObj;
}

export async function getBookingDetails(bookingId) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: { select: { name: true } },
        room: { 
          include: { 
            roomType: true // Ambil detail tipe kamar
          } 
        },
        checkInReceptionist: { select: { name: true } },
        checkOutReceptionist: { select: { name: true } },
        appliedFineItems: { // Ambil denda barang yang diterapkan
          include: {
            fineItem: { select: { name: true } }
          }
        }
      }
    });

    if (!booking) {
      return { success: false, message: 'Data booking tidak ditemukan.' };
    }

    // Konversi semua Decimal di booking & relasinya sebelum dikirim ke Client
    const plainBooking = convertDecimals(booking);

    return { success: true, data: plainBooking };

  } catch (error) {
    console.error('Gagal mengambil detail booking:', error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}