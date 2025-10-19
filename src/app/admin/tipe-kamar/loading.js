// Lokasi: src/app/admin/kamar/loading.js
export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center">
        <div 
          className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"
          role="status"
        >
        </div>
        <p className="mt-4 text-lg font-medium text-gray-700">
          Memuat data tipe kamar...
        </p>
      </div>
    </div>
  );
}