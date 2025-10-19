// Lokasi: src/app/api/laporan/export/route.js

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Helper format tanggal (kita butuh ini lagi)
function formatDateToWIB(date) {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // 1. Ambil Filter dari URL
  const propertyId = searchParams.get('propertyId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!propertyId) {
    return NextResponse.json(
      { success: false, message: 'Property ID wajib diisi.' },
      { status: 400 }
    );
  }

  // 2. Siapkan Kondisi Query (Sama seperti di LaporanPage)
  const dateFrom = from ? new Date(from) : undefined;
  const dateTo = to ? new Date(to) : undefined;
  
  if (dateTo) {
    dateTo.setHours(23, 59, 59, 999);
  }

  const whereClause = {
    isActive: false,
    propertyId: propertyId,
    ...(dateFrom && { actualCheckOutTime: { gte: dateFrom } }),
    ...(dateTo && { actualCheckOutTime: { lte: dateTo } }),
    ...(dateFrom && dateTo && {
      actualCheckOutTime: {
        gte: dateFrom,
        lte: dateTo,
      },
    }),
  };

  // 3. Ambil Data
  try {
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        room: { select: { roomNumber: true } },
        checkInReceptionist: { select: { name: true } },
        checkOutReceptionist: { select: { name: true } },
        appliedFineItems: {
          include: {
            fineItem: { select: { name: true } },
          },
        },
      },
      orderBy: {
        actualCheckOutTime: 'desc',
      },
    });

    // 4. Format Data (Flat) untuk Excel
    // Kita akan ubah data kompleks menjadi data sederhana
    const formattedData = bookings.map(b => ({
      'Nama Tamu': b.guestName,
      'No. WA': b.guestPhone,
      'Alamat Tamu': b.guestAddress,
      'Nama Santri': b.santriName || 'N/A',
      'Kamar': b.room.roomNumber,
      'Check In': formatDateToWIB(b.checkInTime),
      'Penerima Check In': b.checkInReceptionist?.name || 'N/A',
      'Check Out': formatDateToWIB(b.actualCheckOutTime),
      'Penerima Check Out': b.checkOutReceptionist?.name || 'N/A',
      'Status Bayar': b.paymentStatus,
      'Metode Bayar': b.paymentMethod || 'N/A',
      'Harga Dasar (Rp)': b.totalBasePrice?.toNumber() || 0,
      'Denda Telat (Rp)': b.totalLateFee?.toNumber() || 0,
      'Denda Barang (Rp)': b.totalFineItemsAmount?.toNumber() || 0,
      'Uang Muka (Rp)': b.downPaymentAmount?.toNumber() || 0,
      'Grand Total (Rp)': b.grandTotal?.toNumber() || 0,
      'Sanksi/Denda Barang': b.appliedFineItems
        .map(f => `${f.fineItem.name} (x${f.quantity})`)
        .join(', ') || 'Tidak ada',
    }));
    
    return NextResponse.json({ success: true, data: formattedData });

  } catch (error) {
    console.error('Gagal ekspor data:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}