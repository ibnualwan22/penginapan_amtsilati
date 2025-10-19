// Lokasi: src/app/admin/kamar/StatusUpdater.js
'use client';

import { useTransition, useState, useEffect } from 'react';
import { updateRoomStatus } from './actions';

export default function StatusUpdater({ room }) {
  const [isPending, startTransition] = useTransition();
  // 'isLocked' adalah true jika ada booking aktif
  const isLocked = room.isLocked; 
  
  // State lokal untuk status, agar UI update instan
  const [currentStatus, setCurrentStatus] = useState(room.status);

  // Jika data dari server berubah, update state lokal
  useEffect(() => {
    setCurrentStatus(room.status);
  }, [room.status]);

  const handleChange = (e) => {
    if (isLocked) return; // JANGAN lakukan apapun jika terkunci

    const newStatus = e.target.value;
    setCurrentStatus(newStatus); // Update UI optimis
    
    startTransition(async () => {
      const result = await updateRoomStatus(room.id, newStatus);
      if (!result.success) {
        // Jika gagal (karena bug/race condition), kembalikan ke status awal
        alert(result.message);
        setCurrentStatus(room.status);
      }
    });
  };

  return (
    <>
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending || isLocked} // <-- Kunci dropdown
        className={`rounded-md p-2 text-sm text-black
          ${currentStatus === 'AVAILABLE' ? 'bg-green-100 border-green-300' : ''}
          ${currentStatus === 'OCCUPIED' ? 'bg-red-100 border-red-300' : ''}
          ${currentStatus === 'MAINTENANCE' ? 'bg-yellow-100 border-yellow-300' : ''}
          ${isLocked || isPending ? 'opacity-70 cursor-not-allowed' : ''}
        `}
      >
        <option value="AVAILABLE">Tersedia</option>
        <option value="OCCUPIED">Terisi</option>
        <option value="MAINTENANCE">Perbaikan</option>
      </select>
      
      {/* Tampilkan pesan jika terkunci */}
      {isLocked && (
        <span className="text-xs text-red-600 block mt-1">
          (Terisi oleh tamu)
        </span>
      )}
    </>
  );
}