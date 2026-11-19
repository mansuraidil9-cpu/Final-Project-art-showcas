BEGIN;

INSERT INTO artworks (
    slug, title, artist, artwork_date, category,
    image_src, image_alt, image_width, image_height,
    description, tags, uploaded_at, source_url, rights
) VALUES
(
    'la-grande-jatte',
    'A Sunday on La Grande Jatte',
    'Georges Seurat',
    '1884–1886',
    'Lukisan',
    '/alteria/la-grande-jatte.jpg',
    'Orang-orang bersantai di taman tepi sungai pada hari cerah.',
    820, 546,
    'Seurat menggambarkan suasana hari Minggu di tepi Sungai Seine. Titik-titik warna membentuk pepohonan, bayangan, dan pengunjung taman.',
    ARRAY['Pointilisme', 'Taman', 'Sungai'],
    TIMESTAMPTZ '2026-11-18 09:00:00+08',
    'https://commons.wikimedia.org/wiki/File:Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_--_1884_-_Google_Art_Project.jpg',
    'Public domain'
), (
    'wheat-field',
    'Wheat Field with Cypresses',
    'Vincent van Gogh',
    '1889',
    'Lukisan',
    '/alteria/wheat-field.jpg',
    'Ladang gandum keemasan dengan pohon sipres di bawah awan bergelombang.',
    599, 477,
    'Sapuan kuas melengkung memberi kesan gerak pada ladang gandum dan awan. Pohon sipres yang gelap menonjol di antara warna kuning dan biru.',
    ARRAY['Lanskap', 'Gandum', 'Pascaimpresionisme'],
    TIMESTAMPTZ '2026-11-18 10:00:00+08',
    'https://www.metmuseum.org/art/collection/search/436535',
    'Public domain (The Met Open Access, CC0)'
), (
    'woman-with-flowers',
    'A Woman Seated beside a Vase of Flowers',
    'Edgar Degas',
    '1865',
    'Lukisan',
    '/alteria/woman-with-flowers.jpg',
    'Seorang perempuan bertopang dagu di samping vas berisi bunga berwarna-warni.',
    600, 488,
    'Rangkaian bunga memenuhi sebagian besar lukisan, dengan sosok perempuan duduk di tepi kanan sambil memandang ke samping.',
    ARRAY['Potret', 'Bunga', 'Interior'],
    TIMESTAMPTZ '2026-11-18 11:00:00+08',
    'https://www.metmuseum.org/art/collection/search/436121',
    'Public domain (The Met Open Access, CC0)'
), (
    'great-wave',
    'Under the Wave off Kanagawa',
    'Katsushika Hokusai',
    'ca. 1830–32',
    'Seni cetak',
    '/alteria/great-wave.jpg',
    'Ombak biru besar melengkung di atas perahu dengan Gunung Fuji di kejauhan.',
    600, 403,
    'Cetak kayu ini menampilkan perahu-perahu kecil di bawah ombak besar. Gunung Fuji terlihat di antara ombak, jauh di belakang.',
    ARRAY['Ukiyo-e', 'Cetak kayu', 'Laut'],
    TIMESTAMPTZ '2026-11-18 12:00:00+08',
    'https://www.metmuseum.org/art/collection/search/45434',
    'Public domain (The Met Open Access, CC0)'
), (
    'teabowl',
    'Teabowl',
    'Meissen Manufactory',
    'ca. 1720–25',
    'Keramik',
    '/alteria/teabowl.jpg',
    'Mangkuk teh porselen putih dengan motif penunggang kuda berwarna hitam.',
    598, 367,
    'Motif hitam di sisi luar mangkuk porselen menampilkan penunggang kuda dan pepohonan.',
    ARRAY['Porselen', 'Mangkuk teh', 'Dekoratif'],
    TIMESTAMPTZ '2026-11-18 13:00:00+08',
    'https://www.metmuseum.org/art/collection/search/198649',
    'Public domain (The Met Open Access, CC0)'
), (
    'the-oxbow',
    'The Oxbow',
    'Thomas Cole',
    '1836',
    'Lukisan',
    '/alteria/the-oxbow.jpg',
    'Hutan gelap di kiri dan kelokan sungai di dataran terang di kanan.',
    599, 409,
    'Cole menggambarkan kelokan sungai selepas badai. Awan gelap masih menggantung di atas hutan, sementara cahaya menyentuh dataran di seberangnya.',
    ARRAY['Lanskap', 'Sungai', 'Badai'],
    TIMESTAMPTZ '2026-11-18 14:00:00+08',
    'https://www.metmuseum.org/art/collection/search/10497',
    'Public domain (The Met Open Access, CC0)'
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
