// Lokasi: src/app/admin/kamar/page.js

export const dynamic = 'force-dynamic';   // optional: hindari SSG di admin
export const revalidate = 0;              // optional: no cache
export const runtime = 'nodejs';          // optional: pastikan Node runtime

import prisma from '@/lib/prisma';
import PropertySwitcher from '../components/PropertySwitcher';
import UpsertRoomModal from './UpsertRoomModal';
import StatusUpdater from './StatusUpdater';
import DeleteRoomButton from './DeleteRoomButton';
import ImageWithFallback from './ImageWithFallback';

// Helper konversi Decimal (wajib ada)
function convertRoomTypeToPlain(roomType) {
  if (!roomType) return null;
  return {
    ...roomType,
    priceHalfDay: roomType.priceHalfDay?.toNumber?.() ?? 0,
    priceFullDay: roomType.priceFullDay?.toNumber?.() ?? 0,
    lateFeePerHour: roomType.lateFeePerHour?.toNumber?.() ?? 0,
    lateFeeHalfDay: roomType.lateFeeHalfDay?.toNumber?.() ?? 0,
    lateFeeFullDay: roomType.lateFeeFullDay?.toNumber?.() ?? 0,
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

    // Ambil Daftar Kamar (termasuk booking aktif)
    const roomsData = await prisma.room.findMany({
      where: { propertyId: selectedPropertyId },
      include: {
        roomType: true,
        bookings: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: { roomNumber: 'asc' },
    });

    // Proses data agar aman untuk Client Component
    plainRooms = roomsData.map(room => ({
      ...room,
      roomType: convertRoomTypeToPlain(room.roomType),
      isLocked: room.bookings.length > 0,
      bookings: undefined, // hapus data mentah tak-serializable
    }));
  }

  return (
    <div className="text-black">
      <h1 className="text-3xl font-semibold mb-6">Manajemen Kamar</h1>

      <PropertySwitcher
        properties={properties}
        currentPropertyId={selectedPropertyId}
      />

      {/* Tombol "Tambah Kamar" */}
      <UpsertRoomModal
        property={selectedProperty}
        roomTypes={plainRoomTypes}
      />

      <div className="bg-white shadow-md rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Foto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor Kamar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe Kamar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {plainRooms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Belum ada kamar di properti ini.
                </td>
              </tr>
            ) : (
              plainRooms.map((room) => (
                <tr key={room.id}>
                  {/* Foto */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex -space-x-2 overflow-hidden">
                      {room.photos && room.photos.length > 0 ? (
                        room.photos.map((photoUrl, index) => (
                          <ImageWithFallback
                            key={index}
                            src={photoUrl}
                            alt={`Foto ${room.roomNumber} ${index + 1}`}
                            className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                          />
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No Photo</span>
                      )}
                    </div>
                  </td>

                  {/* Nomor Kamar */}
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {room.roomNumber}
                  </td>

                  {/* Tipe Kamar */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {room.roomType?.name || 'N/A'}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusUpdater room={room} />
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <UpsertRoomModal
                      property={selectedProperty}
                      roomTypes={plainRoomTypes}
                      room={room} // mode Edit
                    />
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
