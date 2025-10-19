// Lokasi: src/app/admin/components/DashboardCard.js

// 'Icon' adalah placeholder, bisa diganti dengan SVG/React Icons nanti
export default function DashboardCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      {/* <div className="text-blue-500 mb-2">{icon}</div> */}
      <h3 className="text-sm font-medium text-gray-500 uppercase">
        {title}
      </h3>
      <p className="text-3xl font-semibold text-black">
        {value}
      </p>
    </div>
  );
}