// Lokasi: src/app/admin/components/PropertySwitcher.js
'use client'; // <-- Wajib, karena interaktif

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function PropertySwitcher({ properties, currentPropertyId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e) => {
    const newPropertyId = e.target.value;
    // Buat URL query params baru
    const params = new URLSearchParams(searchParams);
    params.set('propertyId', newPropertyId);
    
    // Ganti URL tanpa me-refresh halaman sepenuhnya
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-4">
      <label htmlFor="property" className="block text-sm font-medium text-gray-700">
        Pilih Properti:
      </label>
      <select
        id="property"
        name="property"
        onChange={handleChange}
        value={currentPropertyId || ''} // Tampilkan properti yang aktif
        className="mt-1 block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-black"
      >
        <option value="" disabled>-- Pilih Properti --</option>
        {properties.map((prop) => (
          <option key={prop.id} value={prop.id}>
            {prop.name}
          </option>
        ))}
      </select>
    </div>
  );
}