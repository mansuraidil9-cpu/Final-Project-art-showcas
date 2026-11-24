import test from 'node:test'
import assert from 'node:assert/strict'
import { CROP_RATIOS, getCanvasSize, getExportSize, layout } from '../src/lib/image-crop-geometry.mjs'

const photo = { naturalWidth: 4000, naturalHeight: 3000 }

test('rasio crop menghasilkan viewport sesuai proporsinya', () => {
  assert.deepEqual(getCanvasSize(CROP_RATIOS.square), { width: 800, height: 800 })
  assert.deepEqual(getCanvasSize(CROP_RATIOS.landscape), { width: 800, height: 600 })
  assert.deepEqual(getCanvasSize(CROP_RATIOS.portrait), { width: 640, height: 800 })
})

test('perubahan resolusi tidak mengubah rasio foto', () => {
  const canvas = { width: 800, height: 600 }
  assert.deepEqual(getExportSize(canvas, photo, 1, 1, false), { width: 1800, height: 1350 })
  assert.deepEqual(getExportSize(canvas, photo, 1, .5, false), { width: 900, height: 675 })
  assert.deepEqual(getExportSize(canvas, photo, 1, .25, false), { width: 450, height: 338 })
})

test('foto profil dibatasi ke 512px', () => {
  assert.deepEqual(getExportSize({ width: 800, height: 800 }, photo, 1, 1, true), { width: 512, height: 512 })
})

test('posisi gambar crop tidak dapat melewati tepi pada zoom minimal', () => {
  assert.deepEqual(layout(photo, 800, 600, 1, { x: 50, y: -20 }), {
    drawWidth: 800, drawHeight: 600, left: 0, top: 0,
  })
})

test('resolusi crop yang lebih kecil tidak memperbesar jumlah piksel', () => {
  const c = { width: 800, height: 800 }
  const original = getExportSize(c, photo, 2, 1, false)
  const reduced = getExportSize(c, photo, 2, .5, false)
  assert.ok(reduced.width < original.width)
  assert.ok(reduced.height < original.height)
})
