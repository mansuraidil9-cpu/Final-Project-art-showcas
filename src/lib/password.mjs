import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { hasValidPasswordLength, isValidNewPassword } from "./account-validation.mjs";

const deriveKey = promisify(scrypt);
const saltLength = 16;
const keyLength = 64;
const options = {
  cost: 32768,
  blockSize: 8,
  parallelization: 3,
  maxmem: 48 * 1024 * 1024,
};
const storedHashPattern = /^scrypt-v1\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{86})$/;
const dummySalt = Buffer.alloc(saltLength);
const dummyKey = Buffer.alloc(keyLength);

export { isValidNewPassword };

export async function hashPassword(password) {
  if (!isValidNewPassword(password)) {
    throw new TypeError("Kata sandi harus berisi 8 sampai 128 karakter tanpa spasi atau karakter tak terlihat.");
  }

  const salt = randomBytes(saltLength);
  const key = await deriveKey(password, salt, keyLength, options);

  return `scrypt-v1$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password, storedHash) {
  const validPassword = hasValidPasswordLength(password);
  const match = typeof storedHash === "string" ? storedHashPattern.exec(storedHash) : null;
  const salt = match ? Buffer.from(match[1], "base64url") : dummySalt;
  const storedKey = match ? Buffer.from(match[2], "base64url") : dummyKey;

  const key = await deriveKey(validPassword ? password : "", salt, keyLength, options);
  const matches = timingSafeEqual(key, storedKey);

  return validPassword && match !== null && matches;
}
