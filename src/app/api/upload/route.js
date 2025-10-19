// Lokasi: src/app/api/upload/route.js

import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';
import fs from 'fs-extra'; // Gunakan fs-extra

export async function POST(request) {
  const data = await request.formData();
  const file = data.get('file');
  const roomId = data.get('roomId'); // Ambil roomId

  if (!file || !roomId) {
    return NextResponse.json({ success: false, message: 'File atau Room ID tidak ditemukan.' }, { status: 400 });
  }

  // Buat nama file unik (misal: timestamp + nama asli)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const originalFilename = file.name;
  const fileExtension = path.extname(originalFilename);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `${roomId}-${uniqueSuffix}${fileExtension}`;

  // Tentukan path penyimpanan (di dalam /public)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rooms');
  const filePath = path.join(uploadDir, filename);

  try {
    // Pastikan direktori ada
    await fs.ensureDir(uploadDir);
    // Tulis file ke sistem file
    await writeFile(filePath, buffer);

    // Kembalikan PATH RELATIF dari folder /public
    const publicPath = `/uploads/rooms/${filename}`;
    console.log(`File berhasil diunggah ke: ${publicPath}`);
    return NextResponse.json({ success: true, path: publicPath });

  } catch (error) {
    console.error('Gagal mengunggah file:', error);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan file.' }, { status: 500 });
  }
}