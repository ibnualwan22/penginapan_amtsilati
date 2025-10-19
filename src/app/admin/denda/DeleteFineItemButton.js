// Lokasi: src/app/admin/denda/DeleteFineItemButton.js
'use client';

import { useTransition } from 'react';
import { deleteFineItem } from './actions';

export default function DeleteFineItemButton({ id, name }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus item "${name}"?`
    );

    if (isConfirmed) {
      startTransition(async () => {
        const result = await deleteFineItem(id);
        if (!result.success) {
          alert(`Gagal menghapus: ${result.message}`);
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 ml-4 disabled:text-gray-400"
    >
      {isPending ? 'Menghapus...' : 'Hapus'}
    </button>
  );
}