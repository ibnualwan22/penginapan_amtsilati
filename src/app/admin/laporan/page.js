// Lokasi: src/app/admin/laporan/page.js

import prisma from '@/lib/prisma';
import PropertySwitcher from '../components/PropertySwitcher';
import DateFilterForm from './DateFilterForm'; // <-- Import komponen filter
import BookingDetailModal from './BookingDetailModal'; // <-- TAMBAHKAN IMPORT INI

// Helper format mata uang
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount)); // Pastikan inputnya Number
}

// Helper format tanggal
function formatDateToWIB(date) {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

export default async function LaporanPage({ searchParams }) {
  // Await searchParams (Next 15)
  const params = await searchParams;

  // 1. Setup Filter
  const properties = await prisma.property.findMany();
  let selectedPropertyId = params?.propertyId;
  if (!selectedPropertyId && properties.length > 0) {
    selectedPropertyId = properties[0].id;
  }

  // Filter Tanggal
  const dateFrom = params?.from ? new Date(params.from) : undefined;
  const dateTo = params?.to ? new Date(params.to) : undefined;
  
  if (dateTo) {
    // Set 'to' ke akhir hari (23:59:59)
    dateTo.setHours(23, 59, 59, 999);
  }

  // 2. Buat Kondisi Query Prisma
  const whereClause = {
    isActive: false, // <-- HANYA tamu yang sudah check-out
    propertyId: selectedPropertyId,
    // Terapkan filter tanggal HANYA jika ada
    ...(dateFrom && { actualCheckOutTime: { gte: dateFrom } }),
    ...(dateTo && { actualCheckOutTime: { lte: dateTo } }),
    // Gabungkan filter jika 'from' dan 'to' ada
    ...(dateFrom && dateTo && {
      actualCheckOutTime: {
        gte: dateFrom,
        lte: dateTo,
      },
    }),
  };

  // 3. Ambil Data Riwayat (sudah ter-filter)
  const completedBookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      room: { select: { roomNumber: true } },
      checkInReceptionist: { select: { name: true } },
      checkOutReceptionist: { select: { name: true } },
      appliedFineItems: { // Ambil denda barang
        include: {
          fineItem: { select: { name: true } }
        }
      }
    },
    orderBy: {
      actualCheckOutTime: 'desc', // Tampilkan yang terbaru di atas
    },
  });

  // 4. Hitung Agregasi Keuangan [cite: 88]
  // Kita HANYA hitung dari data yang sudah ter-filter
  const aggregate = await prisma.booking.aggregate({
    _sum: {
      grandTotal: true, // Total keseluruhan
    },
    where: {
      ...whereClause,
      paymentStatus: 'PAID', // Hanya hitung yang LUNAS
    },
  });

  const aggregateCash = await prisma.booking.aggregate({
    _sum: { grandTotal: true },
    where: {
      ...whereClause,
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
    },
  });
  
  const aggregateTransfer = await prisma.booking.aggregate({
    _sum: { grandTotal: true },
    where: {
      ...whereClause,
      paymentStatus: 'PAID',
      paymentMethod: 'TRANSFER',
    },
  });

  const totalRevenue = aggregate._sum.grandTotal || 0;
  const totalCash = aggregateCash._sum.grandTotal || 0;
  const totalTransfer = aggregateTransfer._sum.grandTotal || 0;

  return (
    <div className="text-black">
      <h1 className="text-3xl font-semibold mb-6">Laporan Riwayat Tamu</h1>
      
      <PropertySwitcher 
        properties={properties} 
        currentPropertyId={selectedPropertyId} 
      />
      
      {/* Komponen Filter Tanggal */}
      <DateFilterForm />

      {/* 5. Tampilkan Informasi Keuangan [cite: 88] */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Total Cash (Lunas)</h3>
          <p className="text-3xl font-semibold text-black">{formatCurrency(totalCash)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Total Transfer (Lunas)</h3>
          <p className="text-3xl font-semibold text-black">{formatCurrency(totalTransfer)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Total Keseluruhan (Lunas)</h3>
          <p className="text-3xl font-semibold text-black">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>
      
      {/* 6. Tabel Riwayat  */}
      <div className="bg-white shadow-md rounded-lg border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamu & Kontak</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kamar & Santri</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In (Penerima)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out (Penerima)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Bayar</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Harga</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {completedBookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                  Tidak ada data laporan untuk properti atau rentang tanggal ini.
                </td>
              </tr>
            ) : (
              completedBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium">{booking.guestName}</div>
                    <div className="text-sm text-gray-600">{booking.guestPhone}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium">{booking.room.roomNumber}</div>
                    <div className="text-sm text-gray-600">{booking.santriName || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div>{formatDateToWIB(booking.checkInTime)}</div>
                    <div>({booking.checkInReceptionist?.name || 'N/A'})</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div>{formatDateToWIB(booking.actualCheckOutTime)}</div>
                    <div>({booking.checkOutReceptionist?.name || 'N/A'})</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap font-medium">{formatCurrency(booking.grandTotal)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <BookingDetailModal bookingId={booking.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}