// Lokasi: src/app/api/santri/route.js

import { NextResponse } from 'next/server';

const SIGAP_API_URL = 'https://sigap.amtsilatipusat.com/api/student';
// (Jika Anda punya API Key, tambahkan di sini atau di .env)
// const SIGAP_API_KEY = process.env.SIGAP_API_KEY; 

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
    // Bangun URL target
    const targetUrl = new URL(SIGAP_API_URL);
    targetUrl.searchParams.append('search', name);
    targetUrl.searchParams.append('limit', 10); // Kita batasi 10 hasil

    const res = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // (Jika perlu API Key)
        // 'Authorization': `Bearer ${SIGAP_API_KEY}` 
      },
      // cache: 'no-store' // Gunakan ini jika data harus selalu baru
    });

    if (!res.ok) {
      throw new Error(`Gagal fetch dari API SIGAP: ${res.statusText}`);
    }

    const data = await res.json();
    
    // Kita asumsikan formatnya { success: true, data: [...] }
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching santri data:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server internal.' },
      { status: 500 }
    );
  }
}