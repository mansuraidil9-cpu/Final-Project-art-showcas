const invalidNameCharacters = /[\p{Cc}\p{Zl}\p{Zp}\p{Bidi_Control}\u200b]/u;
const visibleNameCharacter = /[^\p{White_Space}\p{Default_Ignorable_Code_Point}\p{Mark}\p{C}]/u;
const emailLocalSegment = /^[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+$/i;
const emailDomainLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const forbiddenPasswordCharacters = '\\p{White_Space}\\p{Cc}\\p{Default_Ignorable_Code_Point}';
const forbiddenPasswordPattern = new RegExp('[' + forbiddenPasswordCharacters + ']', 'u');

export const newPasswordPattern = '[^' + forbiddenPasswordCharacters + ']+';

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(email) {
  if (typeof email !== 'string' || email.length > 254) return false;

  const [local, domain, extra] = email.split('@');
  if (!local || local.length > 64 || !domain || extra !== undefined) return false;

  const labels = domain.split('.');
  return local.split('.').every(segment => emailLocalSegment.test(segment)) &&
    labels.length >= 2 && labels.every(label => emailDomainLabel.test(label));
}

export function isValidDisplayName(name) {
  return typeof name === 'string' && name.length <= 120 &&
    visibleNameCharacter.test(name) && !invalidNameCharacters.test(name);
}

export function hasValidPasswordLength(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

export function isValidNewPassword(password) {
  return hasValidPasswordLength(password) && !forbiddenPasswordPattern.test(password);
}
