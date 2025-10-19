// Lokasi: src/lib/calculateFees.js

/**
 * Fungsi utama untuk menghitung seluruh biaya tagihan.
 * Menerima data booking dan data tipe kamar (yang berisi harga & aturan denda).
 */
export function calculateTotals(booking, roomType) {
  // Jika properti gratis atau tidak ada tipe kamar, tidak ada biaya.
  if (!roomType) {
    return {
      basePrice: 0,
      totalLateFee: 0,
      grandTotal: 0,
      lateHours: 0,
      isLate: false,
    };
  }

  // --- 1. Kalkulasi Harga Dasar (Base Price) ---
  // Sesuai rencana[cite: 78], kita tangani durasi kombinasi (misal 3.5 hari)
  const duration = booking.duration; // Ini adalah Decimal, misal 3.5
  const fullDays = Math.floor(duration);
  const halfDays = (duration - fullDays) > 0 ? 1 : 0; // 0.5 hari dihitung 1 paket 1/2 hari

  const priceFullDay = roomType.priceFullDay; // Ini Number, sudah dikonversi
  const priceHalfDay = roomType.priceHalfDay; // Ini Number

  const basePrice = (fullDays * priceFullDay) + (halfDays * priceHalfDay);

  // --- 2. Kalkulasi Denda Keterlambatan (Late Fee) ---
  const { lateFee, lateHours, isLate } = calculateLateFee(booking, roomType);

  // --- 3. Kalkulasi Total (Sebelum Denda Barang) ---
  const grandTotal = basePrice + lateFee;

  return {
    basePrice,
    totalLateFee: lateFee,
    grandTotal, // Total sementara
    lateHours,
    isLate,
  };
}

/**
 * Fungsi inti untuk menghitung denda keterlambatan
 * berdasarkan aturan 3-tier 
 */
function calculateLateFee(booking, roomType) {
  // Ambil waktu dari server. Ini sudah objek Date (UTC).
  const expectedCheckOut = new Date(booking.expectedCheckOutTime);
  const actualCheckOut = new Date(); // Waktu "Sekarang"
  
  // Pastikan kita bekerja di zona waktu WIB
  // (Meskipun server UTC, perbandingan selisihnya akan tetap akurat)
  
  let lateFee = 0;
  let isLate = false;
  
  // Hitung selisih dalam milidetik
  const diffMs = actualCheckOut.getTime() - expectedCheckOut.getTime();
  
  // Jika selisihnya positif, dia terlambat
  if (diffMs <= 0) {
    return { lateFee: 0, lateHours: 0, isLate: false };
  }
  
  isLate = true;

  // Konversi selisih ke JAM (dibulatkan ke atas)
  // 1000ms * 60s * 60m = 3600000
  const totalLateHours = Math.ceil(diffMs / 3600000);

  // Ambil aturan denda dari Tipe Kamar
  const feePerHour = roomType.lateFeePerHour;
  const feeHalfDay = roomType.lateFeeHalfDay;
  const feeFullDay = roomType.lateFeeFullDay;

  // --- Logika dari Rencana Anda [cite: 55-63] ---
  // Pisahkan siklus 24 jam penuh
  const fullDaysLate = Math.floor(totalLateHours / 24);
  const remainingHours = totalLateHours % 24;
  
  // 1. Hitung biaya untuk hari penuh keterlambatan
  let totalFeeForFullDays = fullDaysLate * feeFullDay;

  // 2. Hitung biaya untuk sisa jam
  let totalFeeForRemainingHours = 0;

  if (remainingHours >= 1 && remainingHours <= 11) {
    // Kategori 1: Dihitung murni per jam [cite: 26]
    totalFeeForRemainingHours = remainingHours * feePerHour;
    
  } else if (remainingHours >= 12 && remainingHours <= 15) {
    // Kategori 2: Dihitung 1/2 hari + sisa jam [cite: 34]
    const hoursPastHalfDay = remainingHours - 12;
    totalFeeForRemainingHours = feeHalfDay + (hoursPastHalfDay * feePerHour);
    
  } else if (remainingHours >= 16 && remainingHours <= 23) {
    // Kategori 3: Dihitung sebagai 1 hari penuh (aturan harga terbaik) [cite: 44, 46]
    // Kita cek dulu, apakah hitungan Kategori 2 lebih mahal dari 1 hari?
    const calculatedFee = feeHalfDay + ((remainingHours - 12) * feePerHour);
    
    if (calculatedFee > feeFullDay) {
      // Jika ya, bulatkan ke harga 1 hari [cite: 51]
      totalFeeForRemainingHours = feeFullDay;
    } else {
      // Jika tidak (misal: denda per jam sangat murah), tetap pakai hitungan normal
      totalFeeForRemainingHours = calculatedFee;
    }
  }
  // Jika remainingHours == 0, biayanya 0 (sudah dihitung di fullDaysLate)

  lateFee = totalFeeForFullDays + totalFeeForRemainingHours;

  return { lateFee, lateHours: totalLateHours, isLate };
}