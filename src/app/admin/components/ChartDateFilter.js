// Lokasi: src/app/admin/components/ChartDateFilter.js
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ChartDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get active filters from URL
  const currentRange = searchParams.get('range') || '7days';
  const currentMonth = searchParams.get('month') || ''; // Format YYYY-MM

  // State to manage the month input value
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Update local state if URL changes
  useEffect(() => {
    setSelectedMonth(currentMonth);
  }, [currentMonth]);

  const handleRangeChange = (range) => {
    const params = new URLSearchParams(searchParams);
    params.set('range', range);
    // Remove month param if switching away from 'monthly'
    if (range !== 'monthly') {
      params.delete('month');
    } else if (selectedMonth) {
      // Add month param if switching to 'monthly' and a month is selected
      params.set('month', selectedMonth);
    } else {
        // Default to current month if switching to 'monthly' without a value
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const defaultMonth = `${year}-${month}`;
        params.set('month', defaultMonth);
        setSelectedMonth(defaultMonth); // Update local state too
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    setSelectedMonth(newMonth); // Update local state immediately

    // Update URL immediately when month changes
    const params = new URLSearchParams(searchParams);
    params.set('range', 'monthly'); // Ensure range is set correctly
    if (newMonth) {
        params.set('month', newMonth);
    } else {
        params.delete('month'); // Remove if input is cleared (though type=month usually prevents this)
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const getButtonClass = (range) => {
    return `px-3 py-1 rounded-md text-sm ${
      currentRange === range
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;
  };

  // Get current year and month for max attribute
  const now = new Date();
  const maxMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;


  return (
    <div className="flex justify-end items-center space-x-2 mb-4">
      <button
        onClick={() => handleRangeChange('7days')}
        className={getButtonClass('7days')}
      >
        7 Hari Terakhir
      </button>
      <button
        onClick={() => handleRangeChange('thisMonth')}
        className={getButtonClass('thisMonth')}
      >
        Bulan Ini
      </button>
      <button
        onClick={() => handleRangeChange('monthly')}
        className={getButtonClass('monthly')}
      >
        Pilih Bulan
      </button>
      {/* Show month input only if 'monthly' range is selected */}
      {currentRange === 'monthly' && (
        <input
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          max={maxMonth} // Prevent selecting future months
          className="px-2 py-1 border border-gray-300 rounded-md text-sm text-black"
        />
      )}
    </div>
  );
}