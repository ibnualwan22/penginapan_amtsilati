// Lokasi: src/app/admin/components/DashboardCharts.js
'use client';

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Helper Format Uang (singkat)
const formatShortCurrency = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} Jt`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)} Rb`;
  return value;
};

export default function DashboardCharts({ revenueData, bookingData }) {
  // Gabungkan data berdasarkan tanggal (jika belum)
  const combinedData = revenueData.map(rev => {
    const booking = bookingData.find(book => book.date === rev.date);
    return {
      date: rev.date, // Format 'DD MMM' atau 'YYYY-MM-DD'
      Pemasukan: rev.total,
      'Kamar Disewa': booking ? booking.count : 0,
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[300px] text-xs">
      {/* Grafik Pemasukan (Line Chart) */}
      <div>
        <h4 className="font-semibold mb-2 text-center text-black">Pemasukan</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatShortCurrency} />
            <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
            <Legend />
            <Line type="monotone" dataKey="Pemasukan" stroke="#3b82f6" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Grafik Kamar Disewa (Bar Chart) */}
      <div>
        <h4 className="font-semibold mb-2 text-center text-black">Kamar Disewa</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Kamar Disewa" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}