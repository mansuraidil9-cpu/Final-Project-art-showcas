BEGIN;

INSERT INTO challenges (
    slug, title, category, description, rules, prize,
    cover_image, cover_alt, starts_at, ends_at
) VALUES (
    'kota-setelah-hujan',
    'Kota Setelah Hujan',
    'Lukisan · Ilustrasi · Fotografi',
    'Ceritakan suasana kota setelah hujan melalui medium pilihanmu.',
    ARRAY[
        'Pilih salah satu medium: lukisan, ilustrasi, atau fotografi.',
        'Kirim satu karya orisinal yang menggambarkan suasana kota setelah hujan.',
        'Sertakan judul dan deskripsi singkat tentang suasana yang ingin disampaikan.'
    ],
    'Karya pemenang ditampilkan di galeri ALTERIA.',
    '/alteria/the-oxbow.jpg',
    'Bentang alam dengan langit mendung dan hamparan sungai.',
    TIMESTAMPTZ '2026-11-18 00:00:00+08',
    TIMESTAMPTZ '2026-11-30 23:59:59.999+08'
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
