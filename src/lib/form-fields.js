export function readText(formData, name, { trim = true } = {}) {
  const value = formData.get(name)
  if (typeof value !== 'string' || value.includes('\0')) return ''
  return trim ? value.trim() : value
}
