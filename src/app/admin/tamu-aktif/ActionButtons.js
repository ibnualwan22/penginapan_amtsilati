// Lokasi: src/app/admin/tamu-aktif/ActionButtons.js
'use client';

import Link from 'next/link';
import ReminderButton from './ReminderButton';
import EditBookingModal from './EditBookingModal';

// Komponen ini menerima data booking yang sudah di-serialize (dibersihkan)
export default function ActionButtons({ booking }) {
  return (
    <div className="flex items-center space-x-3">
      {/* Tombol Pengingat */}
      <ReminderButton
        guestName={booking.guestName}
        guestPhone={booking.guestPhone}
        expectedCheckOutTime={booking.expectedCheckOutTime}
      />
      
      {/* Tombol Edit / Check-out Awal */}
      <EditBookingModal booking={booking} />

      {/* Tombol Check-Out (Reguler / Terlambat) */}
      <Link 
        href={`/admin/check-out/${booking.id}`}
        className="text-red-600 hover:text-red-900"
      >
        Check Out
      </Link>
    </div>
  );
}