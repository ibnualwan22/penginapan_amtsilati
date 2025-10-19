// Lokasi: src/app/admin/page.js

import prisma from '@/lib/prisma';
import PropertySwitcher from './components/PropertySwitcher';
import DashboardCard from './components/DashboardCard';
import RoomStatusCard from './components/RoomStatusCard';
import DashboardCharts from './components/DashboardCharts';
import ChartDateFilter from './components/ChartDateFilter';

// Helper konversi Decimal
function convertDecimals(obj) {
  // ... (Fungsi convertDecimals yang rekursif dan aman untuk Date) ...
   if (!obj) return null;
   if (obj instanceof Date) return obj;
   const newObj = { ...obj };
   for (const key in newObj) {
     if (newObj[key] && typeof newObj[key] === 'object' && typeof newObj[key].toNumber === 'function') {
       newObj[key] = newObj[key].toNumber();
     } else if (Array.isArray(newObj[key])) {
       newObj[key] = newObj[key].map(item => convertDecimals(item));
     } else if (typeof newObj[key] === 'object' && newObj[key] !== null && !(newObj[key] instanceof Date)) {
       newObj[key] = convertDecimals(newObj[key]);
     }
   }
   return newObj;
}

export default async function AdminDashboardPage({ searchParams }) {
  
  const params = await searchParams;
  const properties = await prisma.property.findMany();

  let selectedPropertyId = params?.propertyId;
  if (!selectedPropertyId && properties.length > 0) {
    selectedPropertyId = properties[0].id;
  }
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // --- Handle Date Range Filter ---
  const range = params?.range || '7days';
  const selectedMonth = params?.month; // YYYY-MM
  
  let startDate = new Date();
  let endDate = new Date(); // endDate defaults to today

  if (range === '7days') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (range === 'thisMonth') {
    startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  } else if (range === 'monthly' && selectedMonth) {
    const [year, month] = selectedMonth.split('-').map(Number);
    startDate = new Date(year, month - 1, 1); // Month is 0-indexed
    // Calculate the last day of the selected month
    endDate = new Date(year, month, 0); // Day 0 of next month = last day of current month
  } else {
    // Default fallback to 7 days if range is invalid
    startDate.setDate(endDate.getDate() - 7);
  }
  
  startDate.setHours(0, 0, 0, 0); // Start of the day
  endDate.setHours(23, 59, 59, 999); // End of the day

  console.log(`Querying data from ${startDate.toISOString()} to ${endDate.toISOString()}`); // Debugging

  // --- Ambil Data ---
  let stats = { totalKamar: 0, tersedia: 0, terisi: 0, perbaikan: 0 };
  let plainRoomsWithStatus = [];
  let revenueData = [];
  let bookingCountData = [];

  if (selectedPropertyId) {
    // 1. Data Statistik & Status Kamar (Tetap Sama)
    const [totalKamar, tersedia, terisi, perbaikan, roomsData] = await Promise.all([
      prisma.room.count({ where: { propertyId: selectedPropertyId } }),
      prisma.room.count({ where: { propertyId: selectedPropertyId, status: 'AVAILABLE' } }),
      prisma.room.count({ where: { propertyId: selectedPropertyId, status: 'OCCUPIED' } }),
      prisma.room.count({ where: { propertyId: selectedPropertyId, status: 'MAINTENANCE' } }),
      prisma.room.findMany({
          where: { propertyId: selectedPropertyId },
          orderBy: { roomNumber: 'asc' },
          include: {
              roomType: true,
              bookings: {
                  where: { isActive: true },
                  select: { id: true, guestName: true, santriName: true },
                  take: 1,
              },
          },
      })
    ]);
    stats = { totalKamar, tersedia, terisi, perbaikan };
    plainRoomsWithStatus = roomsData.map(room => ({
        ...room,
        roomType: convertDecimals(room.roomType),
        isFreeProperty: selectedProperty?.isFree,
        activeBooking: room.bookings[0] || null,
        bookings: undefined,
      }));

    // 2. Data untuk Grafik (Menggunakan startDate & endDate)
    const revenueResult = await prisma.booking.groupBy({
      by: ['actualCheckOutTime'],
      where: {
        propertyId: selectedPropertyId,
        isActive: false,
        paymentStatus: 'PAID',
        actualCheckOutTime: { gte: startDate, lte: endDate }, // <-- Updated range
      },
      _sum: { grandTotal: true, },
      orderBy: { actualCheckOutTime: 'asc', }
    });
    console.log("Raw Revenue Result:", JSON.stringify(revenueResult, null, 2));


    const bookingCountResult = await prisma.booking.groupBy({
       by: ['checkInTime'],
       where: {
         propertyId: selectedPropertyId,
         checkInTime: { gte: startDate, lte: endDate }, // <-- Updated range
       },
       _count: { id: true, },
       orderBy: { checkInTime: 'asc', }
    });

    // Format data untuk Recharts (sesuaikan dengan rentang waktu dinamis)
    const dateMap = new Map();
    const currentDate = new Date(startDate);
    // Adjust loop to use endDate
    while (currentDate <= endDate) {
        const dateString = currentDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        dateMap.set(dateString, { date: dateString, total: 0, count: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Isi data Pemasukan
    revenueResult.forEach(item => {
        const dateString = item.actualCheckOutTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        if (dateMap.has(dateString)) {
            // --- PERBAIKAN ---
            // Ambil nilai sum (yang berupa string)
            const sumValue = item._sum.grandTotal; 
            // Konversi string ke angka (float/number)
            const amount = sumValue ? parseFloat(sumValue) : 0; 

            // Pastikan konversi berhasil sebelum menambahkan
            if (!isNaN(amount)) {
                dateMap.get(dateString).total += amount; // Tambahkan sebagai angka
            } else {
                // Log jika ada nilai aneh
                console.warn(`Could not parse revenue amount for date ${dateString}:`, sumValue);
            }
            // --- AKHIR PERBAIKAN ---
        }
    });

    // Isi data Jumlah Booking
    bookingCountResult.forEach(item => {
        const dateString = item.checkInTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        if (dateMap.has(dateString)) {
            dateMap.get(dateString).count += item._count.id;
        }
    });
    
    // Konversi Map ke Array
    const chartDataArray = Array.from(dateMap.values());
    revenueData = chartDataArray.map(d => ({ date: d.date, total: d.total }));
    bookingCountData = chartDataArray.map(d => ({ date: d.date, count: d.count }));
    console.log("Final Revenue Data for Chart:", revenueData);
  }
  
  return (
    <div>
      <PropertySwitcher 
        properties={properties} 
        currentPropertyId={selectedPropertyId}
      />
      
      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
         <DashboardCard title="Total Kamar" value={stats.totalKamar} />
         <DashboardCard title="Kamar Tersedia" value={stats.tersedia} />
         <DashboardCard title="Kamar Terisi" value={stats.terisi} />
         <DashboardCard title="Kamar Perbaikan" value={stats.perbaikan} />
      </div>

      {/* Bagian Grafik dengan Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-black">
            Statistik Pendapatan & Penggunaan
          </h3>
          <ChartDateFilter /> 
        </div>
        <DashboardCharts 
          revenueData={revenueData} 
          bookingData={bookingCountData} 
        />
      </div>
      
      {/* Bagian Status Kamar */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
         <h3 className="text-xl font-semibold text-black mb-4">
          Status Kamar
         </h3>
         {plainRoomsWithStatus.length === 0 ? (
          <p className="text-gray-500">Belum ada kamar di properti ini.</p>
         ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {plainRoomsWithStatus.map(room => (
              <RoomStatusCard key={room.id} room={room} />
            ))}
          </div>
         )}
      </div>
    </div>
  );
}