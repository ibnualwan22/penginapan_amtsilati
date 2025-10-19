// Lokasi: src/app/admin/check-in/components/CheckInForm.js
'use client';

import { useEffect, useState, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createBooking } from '../actions';
import { useDebounce } from 'use-debounce';

// --- Komponen Helper Async ---

function SantriSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [finalSantriName, setFinalSantriName] = useState('');
  const [finalSantriDetails, setFinalSantriDetails] = useState(null);
  
  const [debouncedQuery] = useDebounce(query, 500);

  useEffect(() => {
    async function fetchSantri() {
      if (debouncedQuery.length < 3) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/santri?name=${debouncedQuery}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Gagal fetch santri:', error);
        setResults([]);
      }
      setIsLoading(false);
    }
    fetchSantri();
  }, [debouncedQuery]);

  const handleSelectSantri = (santri) => {
    setQuery(santri.name);
    setFinalSantriName(santri.name);
    setFinalSantriDetails(santri);
    setResults([]);
  };

  return (
    <div className="border p-3 rounded bg-gray-50 relative">
      <input type="hidden" name="santriName" value={finalSantriName} />
      <input 
        type="hidden" 
        name="santriDetails" 
        value={finalSantriDetails ? JSON.stringify(finalSantriDetails) : ''} 
      />

      <label className="block text-gray-700 text-sm font-bold mb-2">
        Cari Nama Santri
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
        placeholder="Ketik nama santri (min. 3 huruf)..."
        autoComplete="off"
      />
      
      {(isLoading || results.length > 0) && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {isLoading && <div className="p-2 text-gray-500">Mencari...</div>}
          <ul>
            {results.map((santri) => (
              <li
                key={santri.nis}
                onClick={() => handleSelectSantri(santri)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                <p className="font-medium text-black">{santri.name} - {santri.gender}</p>
                <p className="text-sm text-gray-600">{santri.regency} - {santri.activeDormitory}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AlamatSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [finalAlamat, setFinalAlamat] = useState('');
  
  const [debouncedQuery] = useDebounce(query, 500);

  useEffect(() => {
    async function fetchAlamat() {
      if (debouncedQuery.length < 3) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/alamat?name=${debouncedQuery}`);
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Gagal fetch alamat:', error);
        setResults([]);
      }
      setIsLoading(false);
    }
    fetchAlamat();
  }, [debouncedQuery]);

  const handleSelectAlamat = (alamat) => {
    setQuery(alamat.label);
    setFinalAlamat(alamat.label);
    setResults([]);
  };

  return (
    <div className="mb-4 relative">
      <input type="hidden" name="guestAddress" value={finalAlamat} />

      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="guestAddressQuery">
        Alamat Tamu
      </label>
      <input
        type="text"
        id="guestAddressQuery"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        required
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
        placeholder="Ketik nama kota/kabupaten (min. 3 huruf)..."
        autoComplete="off"
      />
      
      {(isLoading || results.length > 0) && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {isLoading && <div className="p-2 text-gray-500">Mencari...</div>}
          <ul>
            {results.map((alamat) => (
              <li
                key={alamat.id}
                onClick={() => handleSelectAlamat(alamat)}
                className="p-2 hover:bg-gray-100 cursor-pointer text-black"
              >
                {alamat.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Memproses Check-In...' : 'Submit Check-In'}
    </button>
  );
}

export default function CheckInForm({ room, property, roomType }) {
  const initialState = { success: false, message: null };
  const [state, formAction] = useActionState(createBooking, initialState);  
  const [includeSantri, setIncludeSantri] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('NOT_PAID');

  return (
    <form action={formAction}>
      <input type="hidden" name="roomId" value={room.id} />
      <input type="hidden" name="propertyId" value={property.id} />
      <input type="hidden" name="isFree" value={property.isFree} />
      
      {state.message && !state.success && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-semibold mb-4 text-black">Data Tamu & Santri</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="guestName">
              Nama Tamu / Wali
            </label>
            <input
              type="text"
              name="guestName"
              id="guestName"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="guestPhone">
              Nomor WA Tamu (Cth: 08... atau +62...)
            </label>
            <input
              type="text"
              name="guestPhone"
              id="guestPhone"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>

          <AlamatSearch />

          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="includeSantri"
                className="form-checkbox h-5 w-5 text-blue-600"
                checked={includeSantri}
                onChange={(e) => setIncludeSantri(e.target.checked)}
              />
              <span className="ml-2 text-gray-700">Menyertakan Santri</span>
            </label>
          </div>

          {includeSantri && <SantriSearch />}
        </div>

        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-semibold mb-4 text-black">Detail Menginap</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
              Durasi Menginap (Hari)
            </label>
            <input
              type="number"
              name="duration"
              id="duration"
              step="0.5"
              min="0.5"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Cth: 1 atau 1.5"
            />
          </div>

          {!property.isFree && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentMethod">
                  Metode Pembayaran
                </label>
                <select
                  name="paymentMethod"
                  id="paymentMethod"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                >
                  <option value="">(Boleh Dikosongi)</option>
                  <option value="CASH">Cash</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentStatus">
                  Status Pembayaran
                </label>
                <select
                  name="paymentStatus"
                  id="paymentStatus"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                >
                  <option value="NOT_PAID">Belum Bayar</option>
                  <option value="DOWN_PAYMENT">Bayar Dimuka</option>
                  <option value="PAID">Lunas</option>
                </select>
              </div>

              {paymentStatus === 'DOWN_PAYMENT' && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="downPaymentAmount">
                    Nominal Bayar Dimuka (Rp)
                  </label>
                  <input
                    type="number"
                    name="downPaymentAmount"
                    id="downPaymentAmount"
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
              )}
            </>
          )}

          <div className="mt-8">
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  );
}