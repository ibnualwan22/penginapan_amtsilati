// Lokasi: src/app/admin/denda/LateFineForm.js
'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateLateFineSettings } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Menyimpan...' : 'Simpan Pengaturan'}
    </button>
  );
}

export default function LateFineForm({ settings, propertyId }) {
  const initialState = { success: false, message: null };
  const [state, formAction] = useActionState(updateLateFineSettings, initialState);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (state.message) {
      setMessage({ type: state.success ? 'success' : 'error', text: state.message });
      // Sembunyikan pesan setelah 3 detik
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
      <h2 className="text-xl font-semibold mb-4 text-black">Pengaturan Denda Keterlambatan</h2>
      
      {message && (
        <div className={`p-3 rounded mb-4 text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lateFeePerHour">
              Denda Per Jam (Rp)
            </label>
            <input
              type="number"
              name="lateFeePerHour"
              id="lateFeePerHour"
              defaultValue={settings?.lateFeePerHour}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lateFeeHalfDay">
              Denda Paket 1/2 Hari (Rp)
            </label>
            <input
              type="number"
              name="lateFeeHalfDay"
              id="lateFeeHalfDay"
              defaultValue={settings?.lateFeeHalfDay}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lateFeeFullDay">
              Denda Paket 1 Hari (Rp)
            </label>
            <input
              type="number"
              name="lateFeeFullDay"
              id="lateFeeFullDay"
              defaultValue={settings?.lateFeeFullDay}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
        </div>
        <div className="mt-6">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}