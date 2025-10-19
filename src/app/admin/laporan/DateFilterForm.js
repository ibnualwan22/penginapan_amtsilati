// Lokasi: src/app/admin/laporan/DateFilterForm.js
'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx'; // <-- Import library Excel

export default function DateFilterForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State untuk loading tombol ekspor
  const [isExporting, setIsExporting] = useState(false);

  // Ambil tanggal dari URL untuk mengisi nilai default
  const defaultFrom = searchParams.get('from') || '';
  const defaultTo = searchParams.get('to') || '';
  const propertyId = searchParams.get('propertyId');

  const handleSubmit = (e) => {
    // ... (Fungsi ini tetap sama, tidak perlu diubah)
    e.preventDefault();
    const formData = new FormData(e.target);
    const from = formData.get('from');
    const to = formData.get('to');
    
    const params = new URLSearchParams();
    if (propertyId) {
      params.set('propertyId', propertyId);
    }
    if (from) {
      params.set('from', from);
    }
    if (to) {
      params.set('to', to);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // --- FUNGSI BARU UNTUK EKSPOR ---
  const handleExport = async () => {
    if (!propertyId) {
      alert('Pilih properti terlebih dahulu.');
      return;
    }
    setIsExporting(true);

    try {
      // 1. Bangun URL API dengan filter saat ini
      const params = new URLSearchParams();
      params.set('propertyId', propertyId);
      if (defaultFrom) params.set('from', defaultFrom);
      if (defaultTo) params.set('to', defaultTo);
      
      const res = await fetch(`/api/laporan/export?${params.toString()}`);
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data');
      }

      if (result.data.length === 0) {
        alert('Tidak ada data untuk diekspor pada rentang ini.');
        setIsExporting(false);
        return;
      }
      
      // 2. Buat Excel menggunakan SheetJS (xlsx)
      const worksheet = XLSX.utils.json_to_sheet(result.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');

      // 3. Atur nama file
      const fileName = `Laporan_Penginapan_${propertyId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // 4. Picu download
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Error saat ekspor:', error);
      alert('Terjadi kesalahan saat mengekspor data.');
    }
    
    setIsExporting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm border">
      <div>
        <label htmlFor="from" className="block text-sm font-medium text-gray-700">
          Dari Tanggal
        </label>
        <input
          type="date"
          name="from"
          id="from"
          defaultValue={defaultFrom}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
      </div>
      <div>
        <label htmlFor="to" className="block text-sm font-medium text-gray-700">
          Sampai Tanggal
        </label>
        <input
          type="date"
          name="to"
          id="to"
          defaultValue={defaultTo}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Filter
      </button>
      
      {/* Tombol Ekspor Fungsional */}
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ml-auto disabled:bg-gray-400"
      >
        {isExporting ? 'Memproses...' : 'Ekspor ke Excel'}
      </button>
    </form>
  );
}