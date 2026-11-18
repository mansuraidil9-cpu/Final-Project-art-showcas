import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

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

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

export async function hashPassword(password) {
  if (!isValidPassword(password)) {
    throw new TypeError("Kata sandi harus terdiri dari 8 sampai 128 karakter.");
  }

  const salt = randomBytes(saltLength);
  const key = await deriveKey(password, salt, keyLength, options);

  return `scrypt-v1$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password, storedHash) {
  const validPassword = isValidPassword(password);
  const match = typeof storedHash === "string" ? storedHashPattern.exec(storedHash) : null;
  const salt = match ? Buffer.from(match[1], "base64url") : dummySalt;
  const storedKey = match ? Buffer.from(match[2], "base64url") : dummyKey;

  const key = await deriveKey(validPassword ? password : "", salt, keyLength, options);
  const matches = timingSafeEqual(key, storedKey);

  return validPassword && match !== null && matches;
}
