-- Daftar akun Member lama yang memiliki status Curator beserta data terkait.
SELECT
  u.id,
  u.display_name,
  u.email,
  u.curator_status,
  u.curator_applied_at,
  karya.jumlah_karya,
  challenge.jumlah_challenge
FROM users AS u
CROSS JOIN LATERAL (
  SELECT count(*)::integer AS jumlah_karya
  FROM artworks AS a
  WHERE a.owner_id = u.id
) AS karya
CROSS JOIN LATERAL (
  SELECT count(*)::integer AS jumlah_challenge
  FROM challenges AS c
  WHERE c.owner_id = u.id
) AS challenge
WHERE u.role = 'member'
  AND u.curator_status IS NOT NULL
ORDER BY u.created_at, u.id;

-- Saran: tinjau setiap akun dan cadangan database sebelum memperbaiki data.
-- Jika akun tetap Member, set curator_status dan curator_applied_at menjadi NULL.
-- Jika akun memang Curator, ubah role menjadi 'curator' dan pastikan curator_applied_at NULL.
