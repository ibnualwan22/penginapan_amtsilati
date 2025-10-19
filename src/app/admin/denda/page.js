// Lokasi: src/app/admin/denda/page.js

import prisma from '@/lib/prisma';
import PropertySwitcher from '../components/PropertySwitcher';
import LateFineModal from './LateFineModal';
import FineItemModal from './FineItemModal';
import DeleteFineItemButton from './DeleteFineItemButton';

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function DendaPage({ searchParams }) {
  // Selalu await searchParams di Next 15
  const params = await searchParams;

  // 1. Ambil data properti
  const properties = await prisma.property.findMany();
  
  let selectedPropertyId = params?.propertyId;
  if (!selectedPropertyId && properties.length > 0) {
    selectedPropertyId = properties[0].id;
  }
  
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // 2. Ambil data untuk kedua bagian denda
  let plainRoomTypes = []; // Data aman (Number)
  let plainFineItems = []; // Data aman (Number)

  if (selectedProperty && !selectedProperty.isFree) {
    // Ambil Tipe Kamar (untuk Denda Keterlambatan)
    const roomTypesData = await prisma.roomType.findMany({
      where: { propertyId: selectedPropertyId },
      orderBy: { name: 'asc' },
    });
    
    // Ambil Item Denda Barang
    const fineItemsData = await prisma.fineItem.findMany({
      where: { propertyId: selectedPropertyId },
      orderBy: { name: 'asc' },
    });

    // --- SOLUSI ERROR DECIMAL ---
    // Konversi semua data Decimal ke Number
    plainRoomTypes = roomTypesData.map(rt => ({
      ...rt,
      // (Kita hanya perlu data denda di halaman ini)
      priceHalfDay: rt.priceHalfDay.toNumber(),
      priceFullDay: rt.priceFullDay.toNumber(),
      // Konversi harga denda
      lateFeePerHour: rt.lateFeePerHour.toNumber(),
      lateFeeHalfDay: rt.lateFeeHalfDay.toNumber(),
      lateFeeFullDay: rt.lateFeeFullDay.toNumber(),
    }));
    
    plainFineItems = fineItemsData.map(item => ({
      ...item,
      price: item.price.toNumber(),
    }));
    // ----------------------------
  }

  return (
    <div className="text-black">
      <h1 className="text-3xl font-semibold mb-6">Manajemen Denda</h1>
      
      <PropertySwitcher 
        properties={properties} 
        currentPropertyId={selectedPropertyId} 
      />

      {selectedProperty && !selectedProperty.isFree ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* === BAGIAN 1: DENDA KETERLAMBATAN === */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-black">
              Denda Keterlambatan (per Tipe Kamar)
            </h2>
            <div className="bg-white shadow-md rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe Kamar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denda/Jam</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plainRoomTypes.map((rt) => (
                    <tr key={rt.id}>
                      <td className="px-4 py-4 whitespace-nowrap font-medium">{rt.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(rt.lateFeePerHour)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <LateFineModal roomType={rt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* === BAGIAN 2: DENDA BARANG === */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-black">
              Denda Barang (Kehilangan)
            </h2>
            
            <FineItemModal propertyId={selectedProperty.id} />

            <div className="bg-white shadow-md rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plainFineItems.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        Belum ada item denda.
                      </td>
                    </tr>
                  ) : (
                    plainFineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <FineItemModal propertyId={selectedProperty.id} item={item} />
                          <DeleteFineItemButton id={item.id} name={item.name} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* Tampilan jika properti gratis (RJ) */
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <p className="text-gray-700">
            Manajemen Denda tidak berlaku untuk properti gratis.
          </p>
        </div>
      )}
    </div>
  );
}