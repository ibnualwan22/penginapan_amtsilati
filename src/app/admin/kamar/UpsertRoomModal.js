// Lokasi: src/app/admin/kamar/UpsertRoomModal.js
'use client';

import { useState, useRef, useEffect, useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { upsertRoom, updateRoomPhotos } from './actions'; // Action tetap sama

function SubmitButton({ isEditing, isUploading }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      // Disable hanya saat menyimpan data kamar, BUKAN saat upload
      disabled={pending || isUploading} 
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Menyimpan Data...' : (isUploading ? 'Mengunggah Foto...' : (isEditing ? 'Perbarui Kamar' : 'Simpan Kamar Baru'))}
    </button>
  );
}

export default function UpsertRoomModal({ property, roomTypes, room }) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditing = !!room;

  // State untuk menyimpan ID kamar setelah disimpan (terutama untuk mode Create)
  const [savedRoomId, setSavedRoomId] = useState(isEditing ? room.id : null); 
  const [triggerUpload, setTriggerUpload] = useState(false); // State untuk memicu upload

  // State untuk form action (upsertRoom)
  const initialState = { success: false, message: null, roomId: null }; // Tetap pakai ini
  const [state, formAction] = useActionState(upsertRoom, initialState);

  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState(room?.photos || []);
  const [isUploading, startUploadingTransition] = useTransition();
  const [uploadError, setUploadError] = useState(null); // State untuk error upload

  // Reset state saat modal ditutup
  const closeModal = () => {
    setIsOpen(false);
    setSelectedFiles([]);
    setPreviews(room?.photos || []);
    setSavedRoomId(isEditing ? room.id : null);
    setTriggerUpload(false);
    setUploadError(null);
    // Reset state action TIDAK perlu dilakukan
  };

   // Fungsi untuk menangani unggahan file (dipicu oleh useEffect)
  const handleFileUpload = async (roomId) => {
    if (!roomId || selectedFiles.length === 0) {
        // Jika tidak ada roomId atau file baru, langsung tutup
        closeModal();
        return; 
    }

    startUploadingTransition(async () => {
      setUploadError(null); // Reset error
      const uploadedPaths = [];
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', roomId); 

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const result = await res.json();
          if (result.success) {
            uploadedPaths.push(result.path);
          } else {
            throw new Error(result.message || 'Gagal unggah file');
          }
        } catch (error) {
           console.error('Error saat fetch upload:', error);
           setUploadError(`Gagal mengunggah ${file.name}: ${error.message}`);
           // Jangan hentikan proses jika satu file gagal, biarkan yang lain lanjut
        }
      });

      await Promise.all(uploadPromises); 

      // Update DB HANYA jika ada file yang berhasil diunggah
      if (uploadedPaths.length > 0) {
        const updateResult = await updateRoomPhotos(roomId, uploadedPaths);
        if (!updateResult.success) {
            setUploadError(updateResult.message || "Gagal menyimpan path foto ke database.");
        }
      }
      
      // Jika tidak ada error upload selama proses, tutup modal
      if (!uploadError && uploadedPaths.length === selectedFiles.length) {
          closeModal();
      } 
      // Jika ada error, modal tetap terbuka untuk menampilkan pesan error upload
      
      // Reset input file terlepas dari hasil
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
      }
    });
  };

  // Efek setelah formAction (upsertRoom) selesai
  useEffect(() => {
    if (state.success) {
      // Simpan ID kamar (baik dari Edit maupun Create)
      const targetRoomId = isEditing ? room.id : state.roomId;
      setSavedRoomId(targetRoomId);
      
      // Jika ada file yang dipilih, picu proses upload
      if (selectedFiles.length > 0 && targetRoomId) {
          setTriggerUpload(true); // Pemicu untuk efek berikutnya
      } else {
          // Jika tidak ada file, reset form dan tutup modal
          formRef.current?.reset();
          closeModal();
      }
    }
    // Tidak perlu dependensi ke selectedFiles di sini
  }, [state, isEditing, room?.id]); // Hanya bergantung pada hasil form action


  // Efek untuk memulai upload SETELAH ID kamar dikonfirmasi
  useEffect(() => {
      if (triggerUpload && savedRoomId) {
          handleFileUpload(savedRoomId);
          setTriggerUpload(false); // Reset pemicu
      }
  }, [triggerUpload, savedRoomId]); // Bergantung pada pemicu dan ID kamar


  const openModal = () => setIsOpen(true);

  // Fungsi handle perubahan file (tetap sama)
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files).slice(0, 3); // Batasi maks 3 file di frontend
    setSelectedFiles(files);
    
    // Hapus preview lama sebelum membuat yang baru
    previews.forEach(preview => {
        if (preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
    });

    const filePreviews = files.map(file => URL.createObjectURL(file));
    // Jika mode edit, gabungkan foto lama dan preview baru (maks 3)
    const combinedPreviews = isEditing ? [...(room?.photos || []), ...filePreviews].slice(-3) : filePreviews.slice(0, 3);
    setPreviews(combinedPreviews); 
  };
  
  // Fungsi hapus preview (Opsional, tapi bagus)
  const removePreview = (indexToRemove, isExistingPhoto) => {
      if (isExistingPhoto) {
          // TODO: Perlu action untuk menghapus foto dari DB dan file system
          alert("Menghapus foto lama belum diimplementasikan.");
      } else {
          // Hapus dari state file dan preview
          const fileIndexToRemove = indexToRemove - (isEditing ? (room?.photos?.length || 0) : 0);
          const newFiles = selectedFiles.filter((_, i) => i !== fileIndexToRemove);
          const newPreviews = previews.filter((_, i) => i !== indexToRemove);
          
          setSelectedFiles(newFiles);
          setPreviews(newPreviews);
          
          // Reset input file value agar file yang sama bisa dipilih lagi
           if (fileInputRef.current) {
               fileInputRef.current.value = ''; 
           }
      }
  };


  return (
    <>
      {/* ... (Tombol pemicu modal tetap sama) ... */}
       {isEditing ? (
         <button onClick={openModal} className="text-blue-600 hover:text-blue-900">
           Edit
         </button>
       ) : (
         <button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">
           + Tambah Kamar
         </button>
       )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4 text-black">
              {isEditing ? 'Edit Kamar' : 'Tambah Kamar Baru'}
            </h2>
            
            {/* Error dari upsertRoom */}
            {state.message && !state.success && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {state.message}
              </div>
            )}
            {/* Error dari upload file */}
            {uploadError && (
               <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                 {uploadError}
               </div>
            )}
            
            {/* Form HANYA untuk data kamar (bukan file) */}
            <form ref={formRef} action={formAction}>
              <input type="hidden" name="propertyId" value={property?.id} />
              {isEditing && <input type="hidden" name="id" value={room.id} />}

              {/* Input Nomor Kamar & Tipe Kamar */}
              <div className="mb-4">
                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomNumber">Nomor Kamar</label>
                 <input type="text" name="roomNumber" id="roomNumber" defaultValue={room?.roomNumber || ''} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"/>
               </div>
               {!property?.isFree && (
                 <div className="mb-4">
                   <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomTypeId">Tipe Kamar</label>
                   <select name="roomTypeId" id="roomTypeId" defaultValue={room?.roomTypeId || ''} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
                     <option value="">-- Pilih Tipe --</option>
                     {roomTypes.map((type) => (<option key={type.id} value={type.id}>{type.name}</option>))}
                   </select>
                 </div>
               )}
               {/* Tombol Simpan Data Kamar */}
                <div className="mb-6"> {/* Beri jarak sebelum input file */}
                 <SubmitButton isEditing={isEditing} isUploading={isUploading} />
                </div>
            </form>
            
             {/* Input Foto (DI LUAR FORM UTAMA) */}
             <div className="mb-4">
               <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="photos">
                 Foto Kamar (Maksimal 3)
               </label>
               <input
                 ref={fileInputRef}
                 type="file"
                 id="photos"
                 name="photos"
                 multiple
                 accept="image/*"
                 onChange={handleFileChange}
                 // Disable jika sedang proses upload
                 disabled={isUploading} 
                 className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
               />
               <p className="text-xs text-gray-500 mt-1">Pilih file baru untuk mengganti foto lama jika ada.</p>
             </div>

             {/* Preview Foto */}
             {previews.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {previews.map((src, index) => {
                     const isExisting = isEditing && room?.photos?.includes(src);
                     return (
                         <div key={index} className="relative group">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img
                                 src={src} // Bisa blob URL atau path
                                 alt={`Preview ${index + 1}`}
                                 className="h-24 w-full object-cover rounded"
                                 // Hapus blob URL saat komponen unmount/preview berubah
                                 onLoad={(e) => { if (src.startsWith('blob:')) URL.revokeObjectURL(e.target.src); }}
                             />
                             {/* Tombol Hapus Preview (opsional) */}
                             {!isUploading && (
                                <button
                                    type="button"
                                    onClick={() => removePreview(index, isExisting)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Hapus foto ini"
                                >
                                 X
                                </button>
                             )}
                         </div>
                     );
                  })}
                </div>
              )}
              
            <div className="flex items-center justify-end mt-6"> {/* Tombol Batal dipindah ke sini */}
              <button
                type="button"
                onClick={closeModal}
                disabled={isUploading}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                Batal / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}