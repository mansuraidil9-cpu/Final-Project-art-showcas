import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isValidDisplayName,
  isValidEmail,
  normalizeEmail,
} from '../src/lib/account-validation.mjs'
import {
  hashPassword,
  isValidNewPassword,
  verifyPassword,
} from '../src/lib/password.mjs'

test('normalizeEmail trims and lowercases an email string', () => {
  assert.equal(normalizeEmail('  Dina.Studio+Galeri@Example.CO.ID  '), 'dina.studio+galeri@example.co.id')
  assert.equal(normalizeEmail('Aidil@mail.com'), normalizeEmail('aidil@mail.com'))
  assert.equal(normalizeEmail('  '), '')

  for (const value of [undefined, null, 42, ['dina@example.com'], { email: 'dina@example.com' }]) {
    assert.equal(normalizeEmail(value), '')
  }
})

test('isValidEmail accepts dotted domains and enforces address length limits', () => {
  assert.equal(isValidEmail('dina.studio+galeri@example.co.id'), true)
  assert.equal(isValidEmail('dina@mail-seni.example'), true)

  const local = 'a'.repeat(64)
  const domain = `${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`
  assert.equal(isValidEmail(`${local}@${domain}`), true)
  assert.equal(isValidEmail(`${local}@${domain}e`), false)
  assert.equal(isValidEmail(`${local}a@example.com`), false)
  assert.equal(isValidEmail(`dina@${'a'.repeat(64)}.com`), false)
})

test('isValidEmail rejects malformed or non-ASCII addresses', () => {
  const invalid = [
    '',
    'a@b',
    '@mail.com',
    'a@@mail.com',
    'a..b@mail.com',
    'a b@mail.com',
    'a\n@mail.com',
    '.dina@example.com',
    'dina.@example.com',
    'dina@example..com',
    'dina@-example.com',
    'dina@example-.com',
    'dina@exa_mple.com',
    'dina@example.com.',
    'dína@example.com',
    'dina@contoh.みんな',
    'dina\u200b@example.com',
    `${'a'.repeat(500)}@example.com`,
    undefined,
    null,
    123,
    ['dina@example.com'],
  ]

  for (const value of invalid) {
    assert.equal(isValidEmail(value), false, JSON.stringify(value))
  }
})

test('display names allow spaces, numbers, Unicode, emoji and literal punctuation', () => {
  const valid = [
    'ai dil',
    'Dina Putri',
    'Studio 27',
    '12345678',
    '!@#$%^&*()',
    '櫻井アート',
    'ааа',
    'Dina 🎨',
    '😀',
    'Keluarga 👩‍👩‍👧',
    '<b>Nama Galeri</b>',
    "O'Connor; Studio (2026)",
    'A'.repeat(120),
  ]

  for (const value of valid) {
    assert.equal(isValidDisplayName(value), true, JSON.stringify(value))
  }
})

test('display names reject invisible-only text, controls and excessive length', () => {
  const invalid = [
    '',
    '   ',
    '\u200d',
    'Dina\u200bPutri',
    'Dina\u202ePutri',
    'Dina\u2066Putri',
    'Dina\nPutri',
    'Dina\rPutri',
    'Dina\tPutri',
    'Dina\u0000Putri',
    'Dina\u2028Putri',
    'A'.repeat(121),
    'A'.repeat(500),
    undefined,
    null,
    27,
    ['Dina'],
  ]

  for (const value of invalid) {
    assert.equal(isValidDisplayName(value), false, JSON.stringify(value))
  }
})

test('new passwords accept visible values from 8 to 128 characters', () => {
  for (const value of ['12345678', 'Langit#22', 'Galeri🎨2026', 'a'.repeat(128)]) {
    assert.equal(isValidNewPassword(value), true, JSON.stringify(value))
  }
})

test('new passwords reject whitespace, control and default-ignorable characters', () => {
  const invalid = [
    '',
    '1234567',
    'a'.repeat(129),
    'a'.repeat(500),
    'Langit 22',
    ' Langit22',
    'Langit22 ',
    'Langit\t22',
    'Langit\n22',
    'Langit\u00a022',
    'Langit\u000022',
    'Langit\u007f22',
    'Langit\u200b22',
    'Langit\u200d22',
    'Langit\u00ad22',
    'Langit\u202e22',
    'Langit\ufe0f22',
    undefined,
    null,
    12345678,
    ['Langit22'],
  ]

  for (const value of invalid) {
    assert.equal(isValidNewPassword(value), false, JSON.stringify(value))
  }
})

test('password hashing rejects invalid input and verifies a valid password exactly', async () => {
  await assert.rejects(hashPassword('Langit\u200b22'), TypeError)

  const password = 'Langit#22'
  const hash = await hashPassword(password)
  assert.notEqual(hash, password)
  assert.equal(await verifyPassword(password, hash), true)
  assert.equal(await verifyPassword('langit#22', hash), false)
  assert.equal(await verifyPassword(password, 'invalid hash'), false)
})
