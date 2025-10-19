// Lokasi: src/app/admin/tipe-kamar/DeleteRoomTypeButton.js
'use client';

import { useTransition } from 'react';
import { deleteRoomType } from './actions';

export default function DeleteRoomTypeButton({ id, name }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    // Tampilkan konfirmasi browser
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus tipe kamar "${name}"? Ini tidak bisa dibatalkan.`
    );

    if (isConfirmed) {
      startTransition(async () => {
        const result = await deleteRoomType(id);
        
        if (!result.success) {
          // Tampilkan pesan error jika gagal (misal: kamar masih dipakai)
          alert(`Gagal menghapus: ${result.message}`);
        } else {
          // (Opsional) Tampilkan pesan sukses
          // revalidatePath akan me-refresh data secara otomatis
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 ml-4 disabled:text-gray-400 disabled:cursor-not-allowed"
    >
      {isPending ? 'Menghapus...' : 'Hapus'}
    </button>
  );
}