// Lokasi: src/app/admin/components/RoomStatusCard.js
'use client';

import Link from 'next/link';

const getStatusClasses = (status) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 border-green-300 hover:bg-green-200';
    case 'OCCUPIED':
      return 'bg-red-100 border-red-300 hover:bg-red-200'; // Bisa diklik
    case 'MAINTENANCE':
      return 'bg-yellow-100 border-yellow-300 cursor-not-allowed';
    default:
      return 'bg-gray-100 border-gray-300';
  }
};

export default function RoomStatusCard({ room }) {
  const isAvailable = room.status === 'AVAILABLE';
  const isOccupied = room.status === 'OCCUPIED';
  
  // Tentukan Link
  let href = '#';
  if (isAvailable) {
    href = `/admin/check-in/${room.id}`;
  } else if (isOccupied && room.activeBooking) {
    href = `/admin/check-out/${room.activeBooking.id}`; // <-- Link ke Check-Out
  }

  const CardContent = () => (
    <div
      // [BARU] Ukuran lebih besar, cursor pointer jika bisa diklik
      className={`p-4 border rounded-lg shadow-sm transition-colors min-h-[120px] flex flex-col justify-between
        ${getStatusClasses(room.status)}
        ${(isAvailable || isOccupied) ? 'cursor-pointer' : ''} 
      `}
    >
      <div>
        <h4 className="font-bold text-lg text-black truncate">{room.roomNumber}</h4>
        <p className="text-sm text-gray-700 truncate">
          {room.roomType?.name || (room.isFreeProperty ? 'Gratis' : 'N/A')}
        </p>
      </div>
      
      <div className="mt-2 pt-2 border-t text-xs">
        {room.status === 'OCCUPIED' && room.activeBooking && (
          <div className={`${isOccupied ? 'border-red-200' : ''}`}>
            <p className="font-medium truncate text-red-700">
              {room.activeBooking?.guestName}
            </p>
            <p className="truncate text-red-600">
              {room.activeBooking?.santriName || '-'}
            </p>
          </div>
        )}
        {room.status === 'AVAILABLE' && (
           <p className="font-medium text-green-700 border-t border-green-200 pt-2">
              Tersedia
            </p>
        )}
        {room.status === 'MAINTENANCE' && (
           <p className="font-medium text-yellow-700 border-t border-yellow-200 pt-2">
              Perbaikan
            </p>
        )}
      </div>
    </div>
  );

  // Bungkus dengan Link jika Available atau Occupied
  if (isAvailable || isOccupied) {
    return (
      <Link href={href}>
        <CardContent />
      </Link>
    );
  }

  // Jika Maintenance, render sebagai div biasa
  return <CardContent />;
}