// Lokasi: src/app/admin/check-out/components/CheckOutForm.js
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { finalizeCheckOut } from '../actions';

// Helper Format Uang
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Tombol Submit
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Memproses...' : 'Finalisasi Check-Out'}
    </button>
  );
}

// === Form Utama ===
export default function CheckOutForm({ booking, fineItems, initialTotals }) {
  const initialState = { success: false, message: null };
  const [state, formAction] = useActionState(finalizeCheckOut, initialState);
  // State untuk denda barang yang ditambahkan
  const [addedFines, setAddedFines] = useState([]);
  
  // State untuk total tagihan (yang akan berubah-ubah)
  const [totals, setTotals] = useState({
    basePrice: initialTotals.basePrice,
    lateFee: initialTotals.totalLateFee,
    fineItemsTotal: 0,
    grandTotal: initialTotals.grandTotal,
    downPayment: booking.downPaymentAmount || 0,
    remainingBalance: initialTotals.grandTotal - (booking.downPaymentAmount || 0),
  });

  // State untuk dropdown denda
  const [selectedFineId, setSelectedFineId] = useState('');

  // Efek untuk mengkalkulasi ulang total setiap kali denda barang berubah
  useEffect(() => {
    // 1. Hitung total denda barang
    const fineItemsTotal = addedFines.reduce((sum, fine) => sum + (fine.price * fine.quantity), 0);
    
    // 2. Hitung grand total baru
    const newGrandTotal = initialTotals.basePrice + initialTotals.totalLateFee + fineItemsTotal;
    
    // 3. Hitung sisa bayar (potong Uang Muka)
    const newRemainingBalance = newGrandTotal - (booking.downPaymentAmount || 0);

    setTotals({
      basePrice: initialTotals.basePrice,
      lateFee: initialTotals.totalLateFee,
      fineItemsTotal: fineItemsTotal,
      grandTotal: newGrandTotal,
      downPayment: booking.downPaymentAmount || 0,
      remainingBalance: newRemainingBalance,
    });
  }, [addedFines, initialTotals, booking.downPaymentAmount]);

  // Fungsi untuk menambah denda barang ke daftar
  const handleAddFine = () => {
    if (!selectedFineId) return;
    
    const fineToAdd = fineItems.find(f => f.id === selectedFineId);
    if (!fineToAdd) return;

    // Cek apakah sudah ada
    const existingFine = addedFines.find(f => f.id === selectedFineId);
    
    if (existingFine) {
      // Jika sudah ada, tambah quantity
      setAddedFines(
        addedFines.map(f =>
          f.id === selectedFineId ? { ...f, quantity: f.quantity + 1 } : f
        )
      );
    } else {
      // Jika baru, tambahkan ke list
      setAddedFines([...addedFines, { ...fineToAdd, quantity: 1 }]);
    }
    setSelectedFineId(''); // Reset dropdown
  };

  // Fungsi untuk menghapus denda barang dari daftar
  const handleRemoveFine = (id) => {
    setAddedFines(addedFines.filter(f => f.id !== id));
  };

  return (
    <form action={formAction}>
      {/* --- Data Tersembunyi untuk Server Action --- */}
      <input type="hidden" name="bookingId" value={booking.id} />
      <input type="hidden" name="roomId" value={booking.roomId} />
      <input type="hidden" name="totalBasePrice" value={totals.basePrice} />
      <input type="hidden" name="totalLateFee" value={totals.lateFee} />
      <input type="hidden" name="totalFineItemsAmount" value={totals.fineItemsTotal} />
      <input type="hidden" name="grandTotal" value={totals.grandTotal} />
      <input type="hidden" name="appliedFinesJSON" value={JSON.stringify(addedFines)} />

      {/* Pesan Error */}
      {state.message && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- Kolom Kiri: Rincian Tagihan --- */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-semibold mb-4 text-black">Rincian Tagihan</h2>
          
          {/* Detail Keterlambatan */}
          {initialTotals.isLate && (
            <div className="mb-4 p-3 bg-yellow-100 rounded border border-yellow-300">
              <p className="text-yellow-800 font-bold">
                Tamu terlambat {initialTotals.lateHours} jam!
              </p>
            </div>
          )}
          
          {/* Kalkulasi */}
          <div className="space-y-2 text-lg">
            <div className="flex justify-between">
              <span className="text-gray-600">Harga Dasar Kamar:</span>
              <span className="font-medium text-black">{formatCurrency(totals.basePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Denda Keterlambatan:</span>
              <span className="font-medium text-black">{formatCurrency(totals.lateFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Denda Barang:</span>
              <span className="font-medium text-black">{formatCurrency(totals.fineItemsTotal)}</span>
            </div>
            <hr className="my-2"/>
            <div className="flex justify-between text-xl font-bold">
              <span className="text-black">TOTAL TAGIHAN:</span>
              <span className="text-blue-600">{formatCurrency(totals.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-md">
              <span className="text-gray-600">Uang Muka (DP):</span>
              <span className="font-medium text-black">-{formatCurrency(totals.downPayment)}</span>
            </div>
            <hr className="my-2 border-dashed"/>
            <div className="flex justify-between text-2xl font-bold">
              <span className="text-black">SISA BAYAR:</span>
              <span className="text-green-600">{formatCurrency(totals.remainingBalance)}</span>
            </div>
          </div>
        </div>

        {/* --- Kolom Kanan: Aksi --- */}
        <div className="md:col-span-1 space-y-6">
          {/* Bagian Denda Barang */}
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold mb-4 text-black">Tambah Denda Barang</h3>
            <div className="flex space-x-2">
              <select
                value={selectedFineId}
                onChange={(e) => setSelectedFineId(e.target.value)}
                className="flex-grow shadow border rounded w-full py-2 px-3 text-gray-700"
              >
                <option value="">-- Pilih item... --</option>
                {fineItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({formatCurrency(item.price)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddFine}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded"
              >
                +
              </button>
            </div>
            {/* Daftar denda yang ditambahkan */}
            <div className="mt-4 space-y-2">
              {addedFines.map(fine => (
                <div key={fine.id} className="flex justify-between items-center text-sm">
                  <span className="text-black">{fine.name} (x{fine.quantity})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFine(fine.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    [Hapus]
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bagian Finalisasi Pembayaran */}
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold mb-4 text-black">Finalisasi</h3>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentMethod">
                Metode Pembayaran Akhir
              </label>
              <select
                name="paymentMethod"
                id="paymentMethod"
                // Isi default value dari booking jika sudah ada saat check-in
                defaultValue={booking.paymentMethod || ''} 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              >
                <option value="">(Pilih Metode)</option>
                <option value="CASH">Cash</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentStatus">
                Status Pembayaran Akhir
              </label>
              <select
                name="paymentStatus"
                id="paymentStatus"
                required
                // Default ke Lunas jika sisa bayar 0 atau kurang
                defaultValue={totals.remainingBalance <= 0 ? 'PAID' : 'NOT_PAID'} 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              >
                <option value="PAID">Lunas</option>
                <option value="NOT_PAID">Belum Lunas</option>
              </select>
            </div>
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  );
}