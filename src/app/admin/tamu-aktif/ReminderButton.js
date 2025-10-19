// Lokasi: src/app/admin/tamu-aktif/ReminderButton.js
'use client';

// Helper Format Tanggal (kita definisikan di sini agar mandiri)
function formatDateToWIB(date) {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

export default function ReminderButton({ guestName, guestPhone, expectedCheckOutTime }) {
  
  const handleReminder = () => {
    // 1. Normalisasi nomor WA
    // Mengubah 08... menjadi 628... dan menghapus karakter non-angka
    const normalizedPhone = guestPhone.replace(/^[0]/, '62').replace(/[^0-9]/g, '');
    
    // 2. Format waktu checkout
    const formattedDate = formatDateToWIB(expectedCheckOutTime);

    // 3. Buat isi pesan
    const message = `Assalamualaikum, Bpk/Ibu ${guestName}. Kami dari Penginapan Amtsilati ingin mengingatkan bahwa jadwal check-out Anda adalah pada ${formattedDate}. Terima kasih.`;
    
    // 4. Buat URL WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

    // 5. Buka di tab baru
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleReminder}
      className="text-blue-600 hover:text-blue-900 mr-3"
    >
      Pengingat
    </button>
  );
}