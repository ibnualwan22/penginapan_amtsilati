// Lokasi: src/app/admin/kamar/page.js

import prisma from '@/lib/prisma';
import PropertySwitcher from '../components/PropertySwitcher';
import UpsertRoomModal from './UpsertRoomModal'; // <-- Import modal baru
import StatusUpdater from './StatusUpdater';
import DeleteRoomButton from './DeleteRoomButton'; // <-- Import tombol hapus

// Helper konversi Decimal (wajib ada)
function convertRoomTypeToPlain(roomType) {
  if (!roomType) return null;
  return {
    ...roomType,
    priceHalfDay: roomType.priceHalfDay.toNumber(),
    priceFullDay: roomType.priceFullDay.toNumber(),
    lateFeePerHour: roomType.lateFeePerHour.toNumber(),
    lateFeeHalfDay: roomType.lateFeeHalfDay.toNumber(),
    lateFeeFullDay: roomType.lateFeeFullDay.toNumber(),
  };
}

export default async function KamarPage({ searchParams }) {
  const params = await searchParams;

  const properties = await prisma.property.findMany();
  
  let selectedPropertyId = params?.propertyId;
  if (!selectedPropertyId && properties.length > 0) {
    selectedPropertyId = properties[0].id;
  }
  
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Variabel untuk data bersih
  let plainRooms = [];
  let plainRoomTypes = [];

  if (selectedPropertyId) {
    // Ambil Tipe Kamar (untuk modal)
    if (!selectedProperty?.isFree) {
      const roomTypesData = await prisma.roomType.findMany({
        where: { propertyId: selectedPropertyId },
        orderBy: { name: 'asc' },
      });
      plainRoomTypes = roomTypesData.map(rt => convertRoomTypeToPlain(rt));
    }

    // Ambil Daftar Kamar (Termasuk data booking untuk BUG FIX)
    const roomsData = await prisma.room.findMany({
      where: { propertyId: selectedPropertyId },
      include: {
        roomType: true,
        bookings: { // <-- [BUG FIX] Ambil booking aktif
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: { roomNumber: 'asc' },
    });
    
    // Proses data agar aman untuk Client Component
    plainRooms = roomsData.map(room => ({
      ...room,
      roomType: convertRoomTypeToPlain(room.roomType), // Konversi Decimal
      isLocked: room.bookings.length > 0, // <-- [BUG FIX] Tandai jika terkunci
      bookings: undefined, // Hapus data mentah
    }));
  }

  return (
    <div className="text-black">
      <h1 className="text-3xl font-semibold mb-6">Manajemen Kamar</h1>
      
      <PropertySwitcher 
        properties={properties} 
        currentPropertyId={selectedPropertyId} 
      />

      {/* Tombol "Tambah Kamar" (dari modal upsert) */}
      <UpsertRoomModal 
        property={selectedProperty} 
        roomTypes={plainRoomTypes} 
        // 'room' tidak di-pass, artinya ini mode 'Create'
      />

      <div className="bg-white shadow-md rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor Kamar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe Kamar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plainRooms.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  Belum ada kamar di properti ini.
                </td>
              </tr>
            ) : (
              plainRooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{room.roomNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {room.roomType?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* [BUG FIX] Status updater sekarang menerima 'room' 
                        yang berisi 'isLocked' */}
                    <StatusUpdater room={room} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* [BARU] Tombol Edit (dari modal upsert) */}
                    <UpsertRoomModal
                      property={selectedProperty}
                      roomTypes={plainRoomTypes}
                      room={room} // <-- Pass 'room', artinya ini mode 'Edit'
                    />
                    
                    {/* [BARU] Tombol Hapus */}
                    <DeleteRoomButton 
                      roomId={room.id} 
                      roomNumber={room.roomNumber} 
                    />
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