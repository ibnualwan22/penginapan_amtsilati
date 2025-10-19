// Lokasi: src/app/admin/denda/LateFineModal.js
'use client';

import { useState, useRef, useEffect, useActionState  } from 'react';
import { useFormStatus } from 'react-dom';
import { updateLateFineSettings } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
    </button>
  );
}

// Menerima 'roomType' yang berisi data (termasuk denda)
export default function LateFineModal({ roomType }) {
  const [isOpen, setIsOpen] = useState(false);

  const initialState = { success: false, message: null };
  const [state, formAction] = useActionState(updateLateFineSettings, initialState);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      // (Opsional) Tampilkan notifikasi sukses
    }
  }, [state]);
  
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button onClick={openModal} className="text-blue-600 hover:text-blue-900">
        Edit Denda
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-lg">
            <h2 className="text-2xl font-semibold mb-4 text-black">
              Edit Denda Keterlambatan
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              Tipe Kamar: <span className="font-bold">{roomType.name}</span>
            </p>
            
            {state.message && !state.success && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {state.message}
              </div>
            )}
            
            <form action={formAction}>
              <input type="hidden" name="roomTypeId" value={roomType.id} />

              {/* Harga Denda */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lateFeePerHour">
                    Per Jam (Rp)
                  </label>
                  <input
                    type="number"
                    name="lateFeePerHour"
                    id="lateFeePerHour"
                    defaultValue={roomType?.lateFeePerHour}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lateFeeHalfDay">
                    Paket 1/2 Hari (Rp)
                  </label>
                  <input
                    type="number"
                    name="lateFeeHalfDay"
                    id="lateFeeHalfDay"
                    defaultValue={roomType?.lateFeeHalfDay}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lateFeeFullDay">
                    Paket 1 Hari (Rp)
                  </label>
                  <input
                    type="number"
                    name="lateFeeFullDay"
                    id="lateFeeFullDay"
                    defaultValue={roomType?.lateFeeFullDay}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Batal
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}