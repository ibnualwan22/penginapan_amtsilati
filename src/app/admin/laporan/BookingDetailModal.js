// Lokasi: src/app/admin/laporan/BookingDetailModal.js
'use client';

import { useState } from 'react';
import { getBookingDetails } from './actions';

// Helper Format Uang
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

// Helper Format Tanggal
function formatDateToWIB(date) {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

export default function BookingDetailModal({ bookingId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);

  const openModal = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    
    const result = await getBookingDetails(bookingId);
    
    if (result.success) {
      setBooking(result.data);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    setBooking(null); // Bersihkan data saat modal ditutup
  };

  return (
    <>
      {/* Tombol Pemicu Modal */}
      <button
        onClick={openModal}
        className="text-blue-600 hover:text-blue-900"
      >
        Detail
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            
            {isLoading && <p className="text-black text-center">Memuat detail...</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {booking && (
              <>
                <h2 className="text-2xl font-semibold mb-4 text-black">
                  Detail Booking - {booking.guestName}
                </h2>
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Kamar {booking.room.roomNumber} ({booking.property.name})
                </h3>

                {/* Rincian */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                  {/* Kolom 1: Info Tamu & Menginap */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold">Info Tamu</h4>
                      <p>Nama: {booking.guestName}</p>
                      <p>WA: {booking.guestPhone}</p>
                      <p>Alamat: {booking.guestAddress}</p>
                    </div>
                    <div>
                      <h4 className="font-bold">Info Santri</h4>
                      <p>Nama: {booking.santriName || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold">Info Menginap</h4>
                      <p>Check-In: {formatDateToWIB(booking.checkInTime)} (oleh {booking.checkInReceptionist.name})</p>
                      <p>Check-Out: {formatDateToWIB(booking.actualCheckOutTime)} (oleh {booking.checkOutReceptionist.name})</p>
                      <p>Durasi: {booking.duration} hari</p>
                    </div>
                  </div>

                  {/* Kolom 2: Info Pembayaran & Denda */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold">Rincian Tagihan</h4>
                      <p>Harga Dasar: {formatCurrency(booking.totalBasePrice)}</p>
                      <p>Denda Keterlambatan: {formatCurrency(booking.totalLateFee)}</p>
                      <p>Denda Barang: {formatCurrency(booking.totalFineItemsAmount)}</p>
                      <p>Uang Muka (DP): -{formatCurrency(booking.downPaymentAmount || 0)}</p>
                      <p className="font-bold text-lg">Total: {formatCurrency(booking.grandTotal)}</p>
                    </div>
                    <div>
                      <h4 className="font-bold">Pembayaran</h4>
                      <p>Metode: {booking.paymentMethod || 'N/A'}</p>
                      <p>Status: {booking.paymentStatus}</p>
                    </div>
                    <div>
                      <h4 className="font-bold">Denda Barang Diterapkan</h4>
                      {booking.appliedFineItems.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {booking.appliedFineItems.map(fine => (
                            <li key={fine.id}>
                              {fine.fineItem.name} (x{fine.quantity}) - {formatCurrency(fine.priceAtTimeOfFine * fine.quantity)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Tidak ada.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tombol Tutup */}
                <div className="mt-6 text-right">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    Tutup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}