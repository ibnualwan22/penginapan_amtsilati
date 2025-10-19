// Lokasi: src/app/admin/denda/FineItemModal.js
'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { upsertFineItem } from './actions';

function SubmitButton({ isEditing }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Menyimpan...' : (isEditing ? 'Perbarui' : 'Simpan')}
    </button>
  );
}

// Menerima 'item' (opsional) untuk mode Edit
export default function FineItemModal({ propertyId, item }) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditing = !!item;

  const initialState = { success: false, message: null };
  const [state, formAction] = useActionState(upsertFineItem, initialState);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      formRef.current?.reset();
    }
  }, [state]);
  
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {isEditing ? (
        <button onClick={openModal} className="text-blue-600 hover:text-blue-900">
          Edit
        </button>
      ) : (
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          + Tambah Item Denda
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-black">
              {isEditing ? 'Edit Item Denda' : 'Tambah Item Denda Baru'}
            </h2>
            
            {state.message && !state.success && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {state.message}
              </div>
            )}
            
            <form ref={formRef} action={formAction}>
              <input type="hidden" name="propertyId" value={propertyId} />
              {isEditing && <input type="hidden" name="id" value={item.id} />}

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Nama Item (Cth: Bantal)
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  defaultValue={item?.name || ''}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                  Harga Denda (Rp)
                </label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  // Ingat, 'item.price' di sini sudah dikonversi jadi Number
                  defaultValue={item?.price || ''}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                />
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
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