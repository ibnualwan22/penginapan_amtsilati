// Lokasi: src/app/admin/tipe-kamar/page.js

import prisma from '@/lib/prisma';
import PropertySwitcher from '../components/PropertySwitcher';
import RoomTypeModal from './RoomTypeModal';
import DeleteRoomTypeButton from './DeleteRoomTypeButton';

// Helper Format Uang
function formatCurrency(amount) {
  // Ensure amount is a number before formatting
  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
      return 'N/A'; // Or some other placeholder if conversion fails
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numAmount);
}

// --- FUNGSI KONVERSI YANG DIPERBARUI ---
// Pastikan semua field Decimal dikonversi dan aman jika null
function convertRoomTypeToPlain(roomType) {
  if (!roomType) return null;
  return {
    ...roomType,
    priceHalfDay: roomType.priceHalfDay?.toNumber() ?? 0, // Gunakan optional chaining & nullish coalescing
    priceFullDay: roomType.priceFullDay?.toNumber() ?? 0,
    lateFeePerHour: roomType.lateFeePerHour?.toNumber() ?? 0,
    lateFeeHalfDay: roomType.lateFeeHalfDay?.toNumber() ?? 0,
    lateFeeFullDay: roomType.lateFeeFullDay?.toNumber() ?? 0,
  };
}
// --- AKHIR FUNGSI KONVERSI ---

export default async function TipeKamarPage({ searchParams }) {
  const params = await searchParams;

  const properties = await prisma.property.findMany();
  
  let selectedPropertyId = params?.propertyId;
  if (!selectedPropertyId && properties.length > 0) {
    selectedPropertyId = properties[0].id;
  }
  
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  let plainRoomTypes = []; // Variabel untuk data yang sudah bersih
  
  if (selectedProperty && !selectedProperty.isFree) {
    const roomTypesData = await prisma.roomType.findMany({
      where: { propertyId: selectedPropertyId },
      orderBy: { name: 'asc' },
    });

    // --- LAKUKAN KONVERSI DI SINI ---
    plainRoomTypes = roomTypesData.map(rt => convertRoomTypeToPlain(rt));
  }

  return (
    <div className="text-black">
      <h1 className="text-3xl font-semibold mb-6">Manajemen Tipe Kamar, Harga & Denda</h1>
      
      <PropertySwitcher 
        properties={properties} 
        currentPropertyId={selectedPropertyId} 
      />

      {selectedProperty && !selectedProperty.isFree ? (
        <>
          {/* Tombol Tambah menggunakan data properti */}
          <RoomTypeModal propertyId={selectedProperty.id} />

          <div className="bg-white shadow-md rounded-lg border overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Tipe</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga 1/2 Hari</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga 1 Hari</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denda/Jam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denda 1/2 Hari</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denda 1 Hari</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plainRoomTypes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                      Belum ada tipe kamar di properti ini.
                    </td>
                  </tr>
                ) : (
                  // Map menggunakan data yang sudah bersih (plainRoomTypes)
                  plainRoomTypes.map((type) => ( 
                    <tr key={type.id}>
                      <td className="px-4 py-4 whitespace-nowrap font-medium">{type.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(type.priceHalfDay)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(type.priceFullDay)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(type.lateFeePerHour)}</td> {/* Corrected field name */}
                      <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(type.lateFeeHalfDay)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(type.lateFeeFullDay)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {/* Tombol Edit menggunakan data 'type' yang sudah bersih */}
                        <RoomTypeModal propertyId={selectedProperty.id} roomType={type} /> 
                        <DeleteRoomTypeButton id={type.id} name={type.name} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <p className="text-gray-700">
            Manajemen Harga & Denda tidak berlaku untuk properti gratis.
          </p>
        </div>
      )}
    </div>
  );
}