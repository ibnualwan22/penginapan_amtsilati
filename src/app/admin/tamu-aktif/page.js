// Lokasi: src/app/admin/tamu-aktif/page.js

import prisma from '@/lib/prisma';
import PropertySwitcher from '../components/PropertySwitcher';
import ActionButtons from './ActionButtons'; // <-- [BARU] Import

/**
 * Fungsi helper untuk memformat Tanggal (Date) dari database
 */
function formatDateToWIB(date) {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

// Helper konversi Decimal (jika ada)
function convertDecimals(obj) {
  if (!obj) return null;
  if (obj instanceof Date) return obj;
  const newObj = { ...obj };
  for (const key in newObj) {
    if (newObj[key] && typeof newObj[key] === 'object' && typeof newObj[key].toNumber === 'function') {
      newObj[key] = newObj[key].toNumber();
    }
  }
  return newObj;
}


export default async function TamuAktifPage({ searchParams }) {
  const params = await searchParams;
  const properties = await prisma.property.findMany();
  
  let selectedPropertyId = params?.propertyId;
  if (!selectedPropertyId && properties.length > 0) {
    selectedPropertyId = properties[0].id;
  }

  const activeBookings = await prisma.booking.findMany({
    where: {
      propertyId: selectedPropertyId,
      isActive: true,
    },
    include: {
      room: {
        select: { roomNumber: true },
      },
    },
    orderBy: {
      checkInTime: 'asc',
    },
  });

  // [BARU] Serialize data agar aman dikirim ke Client Component
  const plainBookings = activeBookings.map(booking => ({
    ...convertDecimals(booking), // Konversi Decimal (cth: duration)
    // Ubah Date menjadi string ISO
    checkInTime: booking.checkInTime.toISOString(),
    expectedCheckOutTime: booking.expectedCheckOutTime.toISOString(),
  }));

  return (
    <div className="text-black">
      <h1 className="text-3xl font-semibold mb-6">Daftar Tamu Aktif</h1>
      
      <PropertySwitcher 
        properties={properties} 
        currentPropertyId={selectedPropertyId} 
      />

      <div className="bg-white shadow-md rounded-lg border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kamar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamu & Alamat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak WA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ekspektasi Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeBookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Tidak ada tamu yang sedang menginap di properti ini.
                </td>
              </tr>
            ) : (
              // [PENTING] Kita map 'activeBookings' untuk UI, 
              // tapi kirim 'plainBookings' ke Aksi
              activeBookings.map((booking, index) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{booking.room.roomNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{booking.guestName}</div>
                    <div className="text-sm text-gray-600">{booking.guestAddress}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{booking.guestPhone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{booking.santriName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDateToWIB(booking.checkInTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDateToWIB(booking.expectedCheckOutTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* [BARU] Kirim data yang sudah bersih ke Client Component */}
                    <ActionButtons booking={plainBookings[index]} />
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