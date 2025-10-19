// Lokasi: src/app/admin/kamar/UpsertRoomModal.js
'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { upsertRoom } from './actions'; // <-- Import action baru

function SubmitButton({ isEditing }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Menyimpan...' : (isEditing ? 'Perbarui Kamar' : 'Simpan Kamar Baru')}
    </button>
  );
}

// Terima prop 'room' (opsional) untuk mode Edit
export default function UpsertRoomModal({ property, roomTypes, room }) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditing = !!room; // Cek apakah mode Edit

  const initialState = { success: false, message: null };
  const [state, formAction] = useActionState(upsertRoom, initialState);

  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    // Reset state error jika ditutup
    // (workaround untuk React 19 useActionState)
  };

  return (
    <>
      {/* Tombol pemicu modal (berbeda untuk Edit vs Tambah) */}
      {isEditing ? (
        <button onClick={openModal} className="text-blue-600 hover:text-blue-900">
          Edit
        </button>
      ) : (
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          + Tambah Kamar
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-black">
              {isEditing ? 'Edit Kamar' : 'Tambah Kamar Baru'}
            </h2>
            
            {state.message && !state.success && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {state.message}
              </div>
            )}
            
            <form ref={formRef} action={formAction}>
              <input type="hidden" name="propertyId" value={property?.id} />
              {isEditing && <input type="hidden" name="id" value={room.id} />}

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomNumber">
                  Nomor Kamar
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  id="roomNumber"
                  defaultValue={room?.roomNumber || ''} // <-- Isi data jika edit
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              {!property?.isFree && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomTypeId">
                    Tipe Kamar
                  </label>
                  <select
                    name="roomTypeId"
                    id="roomTypeId"
                    defaultValue={room?.roomTypeId || ''} // <-- Isi data jika edit
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">-- Pilih Tipe --</option>
                    {roomTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Batal
                </button>
                <SubmitButton isEditing={isEditing} />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}