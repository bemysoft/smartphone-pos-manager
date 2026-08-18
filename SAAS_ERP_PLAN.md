# Perencanaan Arsitektur SaaS ERP & POS Profesional

Dokumen ini merangkum rencana transisi aplikasi lokal saat ini menjadi platform Software as a Service (SaaS) ERP dan POS yang scalable, multi-tenant, dan berbasis modular (add-on).

## 1. Arsitektur Multi-Tenant (SaaS)
Untuk membuat aplikasi ini menjadi SaaS, sistem harus mendukung banyak toko/perusahaan (Tenant) dalam satu aplikasi tanpa mencampuradukkan data mereka.

*   **Database:** Menggunakan **Firebase Firestore** (direkomendasikan untuk skalabilitas cepat) atau **Cloud SQL (PostgreSQL)** (jika membutuhkan relasi data yang kompleks).
*   **Isolasi Data:** Setiap dokumen/tabel akan memiliki `tenantId`. Setiap kali user login, sistem hanya akan memuat data yang sesuai dengan `tenantId` mereka.
*   **Keamanan:** Firebase Security Rules atau Row-Level Security (RLS) di PostgreSQL akan memastikan Tenant A tidak bisa melihat data Tenant B.

## 2. Struktur Modul Aplikasi
Aplikasi akan dibagi menjadi "Core Features" (selalu aktif) dan "Premium Modules" (diaktifkan melalui pembelian/langganan).

### A. Fitur Standar (Core ERP & POS)
Fitur dasar yang didapatkan oleh setiap tenant saat pertama kali mendaftar:
*   **Dashboard Utama:** Ring0kasan penjualan dan operasional harian.
*   **Manajemen Inventori (Katalog):** Tambah, edit, hapus produk, kategori, dan stok dasar.
*   **Point of Sale (POS):** Kasir untuk mencatat penjualan (tunai/transfer manual) dan mencetak struk.
*   **Manajemen Karyawan (Dasar):** Pengaturan peran (Kasir, Admin, Gudang) dan akses login karyawan.
*   **Laporan Standar:** Laporan penjualan harian/bulanan dasar.
*   **Manajemen Pemasok (Supplier) & Pembelian (Restock):** Pencatatan barang masuk.

### B. Modul Premium (Add-ons / Berbayar)
Modul ini dapat diaktifkan jika tenant membayar biaya langganan tambahan.

1.  **Modul Pembayaran Digital (Midtrans Integration):**
    *   **Konsep:** Tenant menginputkan `Client Key` dan `Server Key` Midtrans mereka sendiri di menu pengaturan aplikasi.
    *   **Fungsi:** Uang pembayaran dari pelanggan akan langsung masuk ke akun Midtrans milik tenant, bukan ke platform SaaS.
    *   **Fitur:** QRIS otomatis, Virtual Account, Kartu Kredit di kasir/invoice.
2.  **Modul AI Assistant & AI Partner (Gemini):**
    *   **Konsep:** Asisten cerdas untuk membantu operasional bisnis.
    *   **Fungsi:** Analisis tren penjualan, rekomendasi restock barang, pembuatan laporan otomatis dengan bahasa natural, dan chatbot layanan pelanggan.
3.  **Modul CRM & Program Loyalitas:**
    *   Manajemen poin pelanggan, diskon member, dan riwayat pembelian pelanggan.
4.  **Modul Cabang (Multi-Branch):**
    *   Satu tenant memiliki banyak cabang/toko dengan visibilitas stok antar cabang.
5.  **Modul Akuntansi Lanjutan:**
    *   Buku besar, neraca, arus kas, dan pencatatan biaya operasional (OPEX) detail.

## 3. Strategi Backup dan Penyimpanan Data

*   **Data Operasional:** Disimpan di Firestore atau PostgreSQL. 
*   **Backup:**
    *   Jika menggunakan **Firebase**: Backup data tenant disimpan di layanan Cloud Storage bawaan Google Cloud/Firebase. Firebase memiliki fitur *Automated Backups* dan ekspor terjadwal (Scheduled Exports).
    *   Tidak perlu menyimpan backup di VPS terpisah jika menggunakan ekosistem serverless Google Cloud, karena Google menangani redundansi data dan backup otomatis.
*   **Kepemilikan Data:** Sebagai penyedia SaaS, Anda (Super Admin) mengelola infrastruktur database, namun tenant dapat diberikan fitur "Export Data" ke CSV/Excel untuk membackup data mereka sendiri secara lokal.

## 4. Alur Kerja (Workflow) Berlangganan (SaaS)

1.  **Pendaftaran (Sign Up):** Pengguna mendaftar, membuat nama toko/tenant, dan masuk ke paket "Free Trial" atau "Basic".
2.  **Marketplace Modul (Add-on Store):** Di dalam aplikasi, terdapat menu "Modul Tambahan" (Marketplace internal).
3.  **Aktivasi Modul:** Tenant memilih modul "Midtrans" atau "AI Assistant".
4.  **Pembayaran ke Anda:** Tenant membayar biaya sewa modul (misal Rp 50.000/bulan) kepada Anda (Penyedia SaaS) melalui payment gateway terpisah.
5.  **Penggunaan:** Setelah aktif, menu pengaturan Midtrans/AI terbuka bagi tenant tersebut untuk dikonfigurasi (memasukkan API Key mereka) dan digunakan di toko mereka.

## 5. Langkah Migrasi (Dari Arsitektur Saat Ini)

Saat ini, aplikasi prototipe menggunakan file JSON lokal (`database.json`) yang tidak cocok untuk skala SaaS. Langkah yang harus diambil selanjutnya:

1.  **Setup Database Cloud (Firebase/Cloud SQL):** Migrasi dari `database.json` ke database sesungguhnya yang mendukung multi-tenancy.
2.  **Implementasi Autentikasi & Multi-Tenant:** Menggunakan Firebase Auth, tambahkan struktur ID Tenant dan relasikan dengan tabel Pengguna.
3.  **Refactor Backend API:** Ubah semua endpoint (Express.js) agar selalu menerima dan memfilter/menyimpan data berdasarkan `tenantId`.
4.  **Buat Sistem Pengelolaan SaaS:** Buat logika berlangganan (subscriptions) dan database tabel `TenantModules` untuk melacak hak akses modul tiap tenant.
5.  **Kembangkan Pengaturan Kunci API (API Key Settings):** Buat antarmuka di mana tenant bisa memasukkan konfigurasi *API Key* pihak ketiga mereka sendiri (seperti kredensial Midtrans).
