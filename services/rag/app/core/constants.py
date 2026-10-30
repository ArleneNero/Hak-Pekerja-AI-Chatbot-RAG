"""
Konstanta, daftar regulasi hukum ketenagakerjaan, dan konfigurasi kata kunci.
Diadaptasi dari HakPekerja_AI_RAG_Clean.ipynb (Cell 4 dan Cell 10).
"""

DOCS = {
    'UU_13_2003': (
        'UU Nomor 13 Tahun 2003 tentang Ketenagakerjaan',
        'https://peraturan.bpk.go.id/Details/43013/uu-no-13-tahun-2003'
    ),
    'UU_6_2023': (
        'UU Nomor 6 Tahun 2023 tentang Penetapan Perppu Cipta Kerja',
        'https://peraturan.bpk.go.id/Details/246523/uu-no-6-tahun-2023'
    ),
    'PP_35_2021': (
        'PP Nomor 35 Tahun 2021 (PKWT, alih daya, waktu kerja, PHK)',
        'https://peraturan.bpk.go.id/Details/161904/pp-no-35-tahun-2021'
    ),
    'PP_36_2021': (
        'PP Nomor 36 Tahun 2021 tentang Pengupahan',
        'https://jdih.kemnaker.go.id/peraturan/detail/1724/peraturan-pemerintah-nomor-36-tahun-2021'
    ),
    'PP_51_2023': (
        'PP Nomor 51 Tahun 2023 (Perubahan PP 36/2021)',
        'https://peraturan.bpk.go.id/Details/270269/pp-no-51-tahun-2023'
    ),
    'PP_49_2025': (
        'PP Nomor 49 Tahun 2025 (Perubahan kedua PP 36/2021)',
        'https://peraturan.bpk.go.id/Details/339037/pp-no-49-tahun-2025'
    ),
    'UU_4_2024': (
        'UU Nomor 4 Tahun 2024 tentang Kesejahteraan Ibu dan Anak',
        'https://peraturan.bpk.go.id/Details/289997/uu-no-4-tahun-2024'
    ),
    'PERMENAKER_6_2016': (
        'Permenaker Nomor 6 Tahun 2016 tentang THR Keagamaan',
        'https://peraturan.bpk.go.id/Details/146101/permenaker-no-6-tahun-2016'
    ),
    'PP_37_2021': (
        'PP Nomor 37 Tahun 2021 tentang Jaminan Kehilangan Pekerjaan',
        'https://peraturan.bpk.go.id/Details/161919/pp-no-37-tahun-2021'
    ),
    'PP_6_2025': (
        'PP Nomor 6 Tahun 2025 (Perubahan PP 37/2021)',
        'https://peraturan.bpk.go.id/Details/314623/pp-no-6-tahun-2025'
    ),
    'MK_168_2023': (
        'Putusan MK Nomor 168/PUU-XXI/2023',
        'https://jdih.kemnaker.go.id/putusan/detail/149/putusan-mahkamah-konstitusi-nomor-168-tahun-2023'
    ),
}

STOPWORDS = {
    'apa', 'apakah', 'yang', 'dan', 'atau', 'dalam', 'dari', 'untuk',
    'dengan', 'menurut', 'berapa', 'saja', 'seorang', 'karyawan',
    'pekerja', 'buruh', 'mendapatkan'
}

LEGAL_DOMAIN_TERMS = {
    # Regulasi & Dasar Hukum Ketenagakerjaan
    'ketenagakerjaan', 'hubungan kerja', 'perjanjian kerja', 'permenaker',
    'undang undang', 'cipta kerja', 'putusan mk', 'mahkamah konstitusi',
    'disnaker', 'kemnaker', 'depnaker', 'phi', 'bipartit', 'tripartit',
    
    # Status Hubungan Kerja & Kontrak
    'pkwt', 'pkwtt', 'kontrak', 'pekerja', 'buruh', 'karyawan', 'pegawai',
    'tenaga kerja', 'outsourcing', 'alih daya', 'magang',

    # Pengupahan & Finansial Ketenagakerjaan
    'upah', 'upahnya', 'gaji', 'gajinya', 'gajian', 'honor', 'pendapatan',
    'tunjangan', 'thp', 'take home pay', 'potong upah', 'denda upah',
    'upah minimum', 'ump', 'umk', 'skala upah', 'kompensasi',

    # PHK, Pesangon, & Berhenti Kerja
    'phk', 'pemutusan hubungan kerja', 'pecat', 'dipecat', 'pemecatan',
    'diberhentikan', 'berhenti kerja', 'resign', 'mengundurkan diri',
    'pesangon', 'uang pesangon', 'uang pisah', 'upmk', 'pmtk',
    'penghargaan masa kerja', 'surat peringatan', 'efisiensi', 'pensiun',

    # THR & Tunjangan Hari Raya
    'thr', 'tunjangan hari raya', 'keagamaan', 'lebaran', 'idul fitri',

    # Waktu Kerja, Lembur, & Istirahat
    'jam kerja', 'waktu kerja', 'lembur', 'overtime', 'istirahat kerja',
    'shift kerja', 'hari kerja',

    # Cuti, Izin, & Perlindungan Khusus
    'cuti', 'tahunan', 'hamil', 'melahirkan', 'keguguran', 'haid',
    'menstruasi', 'kia', 'kesejahteraan ibu',

    # Jaminan Sosial & Serikat
    'bpjs', 'jht', 'jp', 'jkk', 'jkm', 'jkp', 'kehilangan pekerjaan',
    'serikat pekerja', 'serikat buruh'
}

# Kata kunci empati, kebingungan, dan permintaan bantuan awal
EMPATHY_TERMS = {
    'bingung', 'pusing', 'tolong', 'bantu', 'curhat', 'gimana ya',
    'mau tanya', 'mau nanya', 'bisa tanya', 'bisa bantu', 'butuh bantuan',
    'mau konsultasi', 'cerita dikit', 'harus gimana', 'gimana nih'
}

# Direktori pengalihan domain di luar ketenagakerjaan ke layanan / portal resmi pemerintah RI
OUT_OF_SCOPE_CATEGORIES = [
    {
        "category": "pajak_kendaraan",
        "keywords": [
            "pajak kendaraan", "pajak motor", "pajak mobil", "samsat", "stnk", "bpkb",
            "plat nomor", "perpanjang stnk", "ganti plat", "pajak 5 tahunan", "tilang", "etle",
            "sim", "sim c", "sim a", "satpas", "perpanjang sim", "buat sim", "surat izin mengemudi"
        ],
        "label": "Layanan Kendaraan & Kepolisian Lalu Lintas (Samsat / Satpas)",
        "official_name": "Samsat Digital Nasional (SIGNAL) / Digital Korlantas Polri",
        "official_url": "https://digitalkorlantas.id",
        "guidance": "Untuk perpanjangan SIM online, cek tarif pajak kendaraan, dan pengesahan STNK, silakan gunakan aplikasi resmi Digital Korlantas Polri atau SIGNAL."
    },
    {
        "category": "pajak_penghasilan",
        "keywords": [
            "spt tahunan", "lapor spt", "djp online", "efiling", "e-filing", "npwp",
            "pajak penghasilan pribadi", "pph 21 tahunan", "kantor pajak", "kpp pratama"
        ],
        "label": "Perpajakan Pribadi & SPT Tahunan",
        "official_name": "Direktorat Jenderal Pajak (DJP Online)",
        "official_url": "https://pajak.go.id",
        "guidance": "Untuk registrasi NPWP, pelaporan SPT Tahunan, atau informasi kode billing pajak, silakan akses portal resmi DJP atau hubungi Kring Pajak 1500200."
    },
    {
        "category": "bea_cukai_imigrasi",
        "keywords": [
            "bea cukai", "beacukai", "barang impor", "pajak impor", "imei", "daftar imei",
            "imigrasi", "paspor", "buat paspor", "m-paspor", "visa"
        ],
        "label": "Kepabeanan & Keimigrasian",
        "official_name": "Ditjen Bea dan Cukai & Ditjen Imigrasi",
        "official_url": "https://www.beacukai.go.id",
        "guidance": "Untuk pendaftaran IMEI perangkat impor atau bea masuk, silakan akses [Ditjen Bea Cukai](https://www.beacukai.go.id). Untuk antrean paspor dan visa, silakan akses [Ditjen Imigrasi](https://www.imigrasi.go.id)."
    },
    {
        "category": "pidana_kejahatan",
        "keywords": [
            "lapor polisi", "polsek", "polres", "polda", "kejahatan", "pembunuhan", "pencurian",
            "narkoba", "narkotika", "judi online", "judol", "penipuan online", "rekening penipu",
            "kdrt", "kekerasan anak", "penganiayaan"
        ],
        "label": "Layanan Pengaduan Pidana & Siber",
        "official_name": "Patroli Siber Polri / CekRekening",
        "official_url": "https://patrolisiber.id",
        "guidance": "Untuk situasi darurat tindak pidana, hubungi Call Center Polri 110. Untuk melaporkan nomor rekening penipuan online, silakan laporkan melalui [CekRekening Kemkomdigi](https://cekrekening.id) atau [Patroli Siber](https://patrolisiber.id). Untuk kekerasan/KDRT, hubungi Hotline SAPA 129 KemenPPPA."
    },
    {
        "category": "pertanahan_agraria",
        "keywords": [
            "sertifikat tanah", "sengketa tanah", "shm", "ajb", "girik", "bpn", "agraria",
            "balik nama tanah", "sengketa warisan tanah"
        ],
        "label": "Pertanahan & Sertifikat (ATR/BPN)",
        "official_name": "Kementerian ATR/BPN (Sentuh Tanahku)",
        "official_url": "https://www.atrbpn.go.id",
        "guidance": "Untuk pengecekan keaslian berkas sertifikat tanah atau peta bidang, silakan gunakan aplikasi resmi Sentuh Tanahku atau hubungi Kantor Pertanahan setempat."
    },
    {
        "category": "perdata_keluarga",
        "keywords": [
            "gugatan cerai", "perceraian", "hak asuh anak", "harta gono gini", "gono-gini",
            "warisan", "hukum waris", "pengadilan agama", "pengadilan negeri"
        ],
        "label": "Hukum Keluarga & Perdata Umum",
        "official_name": "Mahkamah Agung RI (Pos Bantuan Hukum)",
        "official_url": "https://www.mahkamahagung.go.id",
        "guidance": "Untuk perkara perdata sengketa keluarga, perceraian, atau pembagian waris, Anda dapat berkonsultasi secara cuma-cuma melalui Pos Bantuan Hukum (Posbakum) di Pengadilan Negeri atau Pengadilan Agama setempat."
    },
    {
        "category": "kependudukan",
        "keywords": [
            "ktp", "e-ktp", "kartu keluarga", "akta kelahiran", "akta kematian", "dukcapil", "pindah domisili"
        ],
        "label": "Administrasi Kependudukan",
        "official_name": "Ditjen Dukcapil Kemendagri",
        "official_url": "https://dukcapil.kemendagri.go.id",
        "guidance": "Untuk pengurusan KTP Digital (IKD), Kartu Keluarga, dan akta pencatatan sipil, silakan kunjungi portal Dukcapil di domisili Anda."
    },
    {
        "category": "konsumen",
        "keywords": [
            "perlindungan konsumen", "barang rusak toko", "sengketa konsumen", "penipuan belanja"
        ],
        "label": "Perlindungan Konsumen",
        "official_name": "Badan Perlindungan Konsumen Nasional (BPKN)",
        "official_url": "https://bpkn.go.id",
        "guidance": "Untuk pengaduan hak konsumen atas barang atau layanan niaga yang merugikan, Anda dapat mengajukan laporan melalui portal BPKN."
    },
    {
        "category": "umum_non_hukum",
        "keywords": [
            "resep", "cara membuat", "bumbu masak", "cuaca", "ramalan", "zodiak", "lirik lagu",
            "film", "anime", "game", "koding", "source code", "python script", "javascript error"
        ],
        "label": "Informasi Umum Non-Hukum",
        "official_name": "Pencarian Informasi Umum (Google / Wikipedia)",
        "official_url": "https://www.google.com",
        "guidance": "Topik ini merupakan topik pengetahuan umum di luar ranah regulasi hukum ketenagakerjaan."
    }
]

REDIRECT_SYSTEM_PROMPT = """Anda adalah asisten cerdas yang bertugas mengarahkan pengguna ke instansi/layanan resmi pemerintah Indonesia yang tepat.
Pertanyaan pengguna berada di luar cakupan hukum ketenagakerjaan.
Tugas Anda:
1. Nyatakan dengan santun dan ramah bahwa pertanyaan tersebut berada di luar ruang lingkup hukum ketenagakerjaan Indonesia.
2. Jelaskan kementerian, lembaga, atau instansi resmi pemerintah yang berwenang menanganinya.
3. Cantumkan tautan resmi (format markdown [Nama Layanan](URL) dengan domain resmi .go.id jika ada) atau kanal layanan resmi (misal nomor call center atau aplikasi resmi).
4. Ingatkan bahwa Hak Ketenagakerjaan AI siap membantu kapan saja jika pengguna memiliki pertanyaan seputar hak pekerja, gaji/upah, pesangon PHK, kontrak kerja, atau cuti.
Jawab ringkas dalam Bahasa Indonesia."""

SYSTEM_PROMPT = """Anda adalah asisten informasi hukum ketenagakerjaan Indonesia berbasis bukti.
Gunakan HANYA kutipan sumber yang diberikan. Jangan mengarang pasal, ayat, angka, halaman, status keberlakuan, atau akibat hukum.
Setiap klaim substantif wajib diakhiri sitasi [S1], [S2], dst. Kutipan dari Putusan MK harus disebut sebagai putusan/pertimbangan/amar sesuai metadata, bukan disamarkan sebagai pasal peraturan.
Jika bukti tidak cukup atau konflik, nyatakan keterbatasannya secara tegas. Jawab ringkas dalam Bahasa Indonesia dan tutup dengan: "Informasi umum, bukan nasihat hukum profesional."

Bedakan aturan umum dari ketentuan yang hanya berlaku pada kondisi khusus. Untuk pertanyaan umum tentang perbedaan PKWT dan PKWTT, jangan menambahkan ketentuan pekerja harian atau perubahan status yang bersyarat kecuali pengguna menanyakannya secara khusus.

Jika ada riwayat percakapan sebelumnya (misalnya pertanyaan lanjutan terkait masa kerja dan nominal gaji seperti perhitungan THR proporsional, uang kompensasi PKWT, atau pesangon PHK), gabungkan informasi tersebut secara koheren dan lakukan perhitungan matematis yang tepat sesuai ketentuan regulasi dalam bukti rujukan.
"""

