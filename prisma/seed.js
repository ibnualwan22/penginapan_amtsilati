// Import PrismaClient dan bcrypt
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Mulai proses seeding...');

  // 1. Buat Role "Super Admin"
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
    },
  });
  console.log(`Role "${superAdminRole.name}" berhasil dibuat/diperbarui.`);

  // 2. Hash password untuk Super Admin
  // GANTI 'password123' DENGAN PASSWORD AMAN ANDA JIKA MAU
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. Buat User "Super Admin"
  // User ini tidak terikat ke properti manapun (propertyId: null)
  const superAdminUser = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      name: 'Super Admin',
      username: 'superadmin',
      password: hashedPassword,
      roleId: superAdminRole.id,
      // propertyId dibiarkan null (default)
    },
  });
  console.log(`User "${superAdminUser.username}" berhasil dibuat.`);

  // 4. Buat Properti Gratis (Raudhatul Jannah)
  const rj = await prisma.property.upsert({
    where: { name: 'Raudhatul Jannah' },
    update: {},
    create: {
      name: 'Raudhatul Jannah',
      isFree: true,
    },
  });
  console.log(`Properti "${rj.name}" (Gratis) berhasil dibuat.`);

  // 5. Buat Properti Berbayar (Raudhatul Muta'alimin)
  const rm = await prisma.property.upsert({
    where: { name: 'Raudhatul Muta’alimin' },
    update: {},
    create: {
      name: 'Raudhatul Muta’alimin',
      isFree: false,
    },
  });
  console.log(`Properti "${rm.name}" (Berbayar) berhasil dibuat.`);

  // 6. Buat Tipe Kamar Default untuk RM (Properti Berbayar)
  const standarRoom = await prisma.roomType.upsert({
  where: { name_propertyId: { name: 'Standar', propertyId: rm.id } },
  update: {},
  create: {
    name: 'Standar',
    priceHalfDay: 250000, // Harga jual
    priceFullDay: 300000, // Harga jual
    lateFeePerHour: 20000,  // Denda per jam [cite: 23]
    lateFeeHalfDay: 250000, // Denda 1/2 hari [cite: 24]
    lateFeeFullDay: 300000, // Denda 1 hari [cite: 25]
    propertyId: rm.id,
  },
});
  console.log(`Tipe Kamar "${standarRoom.name}" untuk RM berhasil dibuat.`);

  const specialRoom = await prisma.roomType.upsert({
  where: { name_propertyId: { name: 'Special', propertyId: rm.id } },
  update: {},
  create: {
    name: 'Special',
    priceHalfDay: 300000, // Harga jual
    priceFullDay: 350000, // Harga jual
    lateFeePerHour: 20000,  // Denda per jam (kita asumsikan sama)
    lateFeeHalfDay: 300000, // Denda 1/2 hari
    lateFeeFullDay: 350000, // Denda 1 hari
    propertyId: rm.id,
  },
});
  console.log(`Tipe Kamar "${specialRoom.name}" untuk RM berhasil dibuat.`);

  // 7. Buat Pengaturan Denda Default untuk RM
  const settings = await prisma.propertySettings.upsert({
  where: { propertyId: rm.id },
  update: {},
  create: {
    propertyId: rm.id,
  },
});
  console.log('Pengaturan denda default untuk RM berhasil dibuat.');

  console.log('Seeding selesai.');
}

// Jalankan fungsi main dan pastikan koneksi ditutup
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });