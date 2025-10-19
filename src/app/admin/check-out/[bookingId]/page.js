// Lokasi: src/app/admin/check-out/[bookingId]/page.js
    
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { calculateTotals } from '@/lib/calculateFees';
import CheckOutForm from '../components/CheckOutForm'; // <-- [BARU] Import

/**
 * Helper untuk konversi Decimal ke Number agar aman dikirim ke Client
 */
function convertDecimals(obj) {
  if (!obj) return null;
  // Jangan proses jika ini adalah objek Date
  if (obj instanceof Date) {
    return obj;
  }

  const newObj = { ...obj };
  for (const key in newObj) {
    // Cek jika propertinya ada, objek, dan punya .toNumber (itu Decimal)
    if (newObj[key] && typeof newObj[key] === 'object' && typeof newObj[key].toNumber === 'function') {
      newObj[key] = newObj[key].toNumber();
    } 
    // Cek jika array, ulangi untuk tiap item
    else if (Array.isArray(newObj[key])) {
      newObj[key] = newObj[key].map(item => convertDecimals(item));
    } 
    // Cek jika objek lain (bukan Date), ulangi secara rekursif
    else if (typeof newObj[key] === 'object' && newObj[key] !== null && !(newObj[key] instanceof Date)) {
      newObj[key] = convertDecimals(newObj[key]);
    }
  }
  return newObj;
}

/**
 * Helper untuk konversi semua Decimal di Tipe Kamar
 */
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

export default async function CheckOutPage({ params }) {
  const { bookingId } = await params;

  // 1. Ambil semua data terkait booking ini
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: {
        include: {
          roomType: true,
        },
      },
      property: true,
    },
  });

  // 2. Validasi
  if (!booking || !booking.isActive) {
    redirect('/admin/tamu-aktif?error=booking_not_found');
  }

  // 3. Ambil daftar Denda Barang
  const fineItems = await prisma.fineItem.findMany({
    where: { propertyId: booking.propertyId },
    orderBy: { name: 'asc' },
  });

  // 4. Konversi semua data Decimal agar aman
  const plainBooking = convertDecimals(booking);
  const plainRoomType = convertRoomTypeToPlain(booking.room.roomType);
  const plainFineItems = fineItems.map(item => convertDecimals(item));

  // 5. Hitung tagihan AWAL
  const initialTotals = calculateTotals(plainBooking, plainRoomType);

  return (
    <div className="text-black">
      <h1 className="text-3xl font-semibold mb-2">Proses Check-Out</h1>
      <p className="text-xl mb-6 text-gray-700">
        Tamu: <span className="font-bold">{booking.guestName}</span>
        {' / '}
        Kamar: <span className="font-bold">{booking.room.roomNumber}</span>
      </p>
      
      {/* [BARU] Render Form Interaktif */}
      <CheckOutForm
        booking={plainBooking}
        fineItems={plainFineItems}
        initialTotals={initialTotals}
      />
    </div>
  );
}