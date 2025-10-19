// Lokasi: src/app/admin/kamar/DeleteRoomButton.js
'use client';

import { useTransition } from 'react';
import { deleteRoom } from './actions';

export default function DeleteRoomButton({ roomId, roomNumber }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm(`Yakin ingin menghapus Kamar ${roomNumber}? Tindakan ini tidak bisa dibatalkan.`)) {
      startTransition(async () => {
        const result = await deleteRoom(roomId);
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