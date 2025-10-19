// Lokasi: src/app/admin/tamu-aktif/EditBookingModal.js
'use client';

import { useState, useActionState, useTransition } from 'react';
import { extendBooking, prepareEarlyCheckOut } from './actions';

function SubmitExtendButton() {
  const { pending } = useTransition(); // Gunakan useTransition untuk form
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
    </button>
  );
}

export default function EditBookingModal({ booking }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // State untuk form Perpanjang Durasi
  const initialState = { success: false, message: null };
  const [state, formAction] = useActionState(extendBooking, initialState);

  // State untuk tombol Check Out Awal
  const [isCheckingOut, startCheckOutTransition] = useTransition();

  const handleEarlyCheckOut = () => {
    startCheckOutTransition(async () => {
      // Panggil server action
      await prepareEarlyCheckOut(booking.id, booking.checkInTime);
    });
  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button onClick={openModal} className="text-yellow-600 hover:text-yellow-900 mr-3">
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-black">Edit Pemesanan</h2>
            
            {state.message && (
              <div className={`p-3 rounded mb-4 text-sm ${
                state.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
              }`}>
                {state.message}
              </div>
            )}

            {/* Form 1: Perpanjang Durasi */}
            <form action={formAction}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="checkInTime" value={booking.checkInTime} />
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newDuration">
                  Ubah Durasi Menginap (Hari)
                </label>
                <input
                  type="number"
                  name="newDuration"
                  id="newDuration"
                  step="0.5"
                  min="0.5"
                  defaultValue={booking.duration}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                />
              </div>
              <SubmitExtendButton />
            </form>
            
            <hr className="my-6" />

            {/* Aksi 2: Check Out Lebih Awal */}
            <div>
              <h3 className="text-lg font-medium text-black">Check Out Lebih Awal</h3>
              <p className="text-sm text-gray-600 mb-3">
                Ini akan menghitung ulang durasi menginap berdasarkan waktu sekarang dan
                mengarahkan Anda ke halaman check-out.
              </p>
              <button
                onClick={handleEarlyCheckOut}
                disabled={isCheckingOut}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
              >
                {isCheckingOut ? 'Memproses...' : 'Mulai Check-Out Awal'}
              </button>
            </div>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={closeModal}
              className="mt-6 text-gray-600 hover:text-gray-800"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </>
  );
}