export const reportOptions = [
  { value: 'plagiarism', label: 'Plagiarisme atau pelanggaran hak cipta' },
  { value: 'ai', label: 'Karya AI tanpa keterangan' },
  { value: 'inappropriate', label: 'Konten tidak pantas atau melanggar aturan' },
  { value: 'spam', label: 'Spam atau tidak sesuai tema Challenge' },
  { value: 'other', label: 'Alasan lainnya' },
]

// Hanya pilihan yang dikenal yang diterima server.
// Alasan disimpan sebagai teks pada skema laporan lama (maksimal 500 karakter).
export function buildReportReason(type, detail) {
  if (typeof type !== 'string' || typeof detail !== 'string') return null
  const selected = reportOptions.find(option => option.value === type)
  const text = detail.trim()
  if (!selected || text.length > 300 || text.includes('\0') ||
      (type === 'other' && text.length < 5)) return null
  const reason = text ? selected.label + ' — ' + text : selected.label
  return reason.length <= 500 ? reason : null
}
