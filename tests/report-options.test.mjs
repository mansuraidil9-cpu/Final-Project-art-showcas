import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReportReason, reportOptions } from '../src/lib/report-options.mjs'

test('alasan laporan memiliki enam pilihan unik termasuk SARA', () => {
  assert.equal(reportOptions.length, 6)
  assert.equal(new Set(reportOptions.map(item => item.value)).size, 6)
  assert.ok(reportOptions.some(item => item.value === 'sara'))
})

test('alasan pilihan dapat disimpan tanpa kolom tautan karya asli', () => {
  assert.equal(buildReportReason('sara', ''), 'SARA (suku, agama, ras, antargolongan)')
  assert.equal(buildReportReason('spam', ''), 'Spam atau tidak sesuai tema Challenge')
  assert.equal(buildReportReason('ai', 'Ilustrasi tidak diberi label'),
    'Karya AI tanpa keterangan — Ilustrasi tidak diberi label')
})

test('alasan lain wajib memiliki keterangan', () => {
  assert.equal(buildReportReason('other', ''), null)
  assert.equal(buildReportReason('other', 'abcd'), null)
  assert.equal(buildReportReason('other', 'Bukti tambahan'), 'Alasan lainnya — Bukti tambahan')
})

test('input tidak dikenal, terlalu panjang, dan berisi NUL ditolak', () => {
  assert.equal(buildReportReason('unknown', 'alasan'), null)
  assert.equal(buildReportReason('spam', 'x'.repeat(301)), null)
  assert.equal(buildReportReason('spam', 'a\0b'), null)
})
