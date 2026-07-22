import { createHmac } from 'node:crypto'

// RFC 6238 TOTP generator for e2e — computes the same codes an authenticator
// app would, from the manual-entry key the settings page displays during
// enrollment. Defaults match Better Auth's TOTP options (SHA-1, 6 digits,
// 30-second period).
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(input: string): Buffer {
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of input.toUpperCase().replace(/=+$/, '')) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) throw new Error('invalid base32 secret')
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

export function totpCode(secret: string, { digits = 6, period = 30, now = Date.now() } = {}) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 1000 / period)))
  const hmac = createHmac('sha1', base32Decode(secret)).update(counter).digest()
  const offset = hmac.readUInt8(hmac.length - 1) & 0xf
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits
  return code.toString().padStart(digits, '0')
}
