// Lokasi: src/app/api/alamat/route.js

import { NextResponse } from 'next/server';

const ALAMAT_API_URL = 'https://backapp.amtsilatipusat.com/api/regencies';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json(
      { success: false, message: 'Parameter nama wajib diisi.' },
      { status: 400 }
    );
  }

  try {
    const targetUrl = new URL(ALAMAT_API_URL);
    targetUrl.searchParams.append('name', name);

    const res = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal fetch dari API Alamat: ${res.statusText}`);
    }

    const data = await res.json();
    
    // Sesuai contoh Anda, formatnya {"query":"...","results":[...]}
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching alamat data:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server internal.' },
      { status: 500 }
    );
  }
}