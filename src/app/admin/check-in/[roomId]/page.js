// Lokasi: src/app/admin/check-in/[roomId]/page.js

import prisma from '@/lib/prisma';
import CheckInForm from '../components/CheckInForm';
import { redirect } from 'next/navigation';

// --- FUNGSI YANG DIPERBAIKI (Versi Eksplisit) ---
// Kita akan konversi manual field yang kita tahu adalah Decimal
// Ini jauh lebih aman daripada iterasi.
function convertRoomTypeToPlain(roomType) {
  // Jika roomType null (properti gratis), kembalikan null
  if (!roomType) {
    return null;
  }
  
  // Konversi semua 5 field Decimal menjadi Number
  return {
    ...roomType,
    priceHalfDay: roomType.priceHalfDay.toNumber(),
    priceFullDay: roomType.priceFullDay.toNumber(),
    lateFeePerHour: roomType.lateFeePerHour.toNumber(),
    lateFeeHalfDay: roomType.lateFeeHalfDay.toNumber(),
    lateFeeFullDay: roomType.lateFeeFullDay.toNumber(),
  };
}
// ---------------------------------

export default async function CheckInPage({ params }) {
  const { roomId } = await params;

  // 1. Ambil data kamar, properti, dan tipe kamar
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      property: true,
      roomType: true,
    },
  });

  // 2. Validasi
  if (!room) {
    return <div>Kamar tidak ditemukan.</div>;
  }

  if (room.status !== 'AVAILABLE') {
    // Jika kamar tidak tersedia, lempar kembali ke dashboard
    redirect('/admin?error=room_not_available');
  }

  // 3. Konversi data 'roomType' yang mengandung Decimal
  const plainRoomType = convertRoomTypeToPlain(room.roomType);

  // 4. Buat objek 'room' yang "bersih" untuk dikirim ke Client
  // Ini PENTING: Kita tidak mengirim 'room' utuh karena
  // 'room.roomType' di dalamnya masih objek Decimal asli.
  const plainRoom = {
    id: room.id,
    roomNumber: room.roomNumber,
    status: room.status,
    propertyId: room.propertyId,
    // Kita tidak perlu 'room.roomType' di sini
  };

  return (
    <div className="text-black">
      <h1 className="text-3xl font-semibold mb-2">Form Check-In</h1>
      <p className="text-xl mb-6 text-gray-700">
        Kamar: <span className="font-bold">{room.roomNumber}</span>
        {' - '}
        Properti: <span className="font-bold">{room.property.name}</span>
      </p>
      
      <CheckInForm 
        room={plainRoom} // <-- Kirim objek 'room' yang sudah bersih
        property={room.property} // Properti tidak punya Decimal, jadi aman
        roomType={plainRoomType} // Kirim objek 'roomType' yang sudah bersih
      />
    </div>
  );
}