import { randomBytes, createHmac } from 'crypto'
import log from './log'

/**
 * Returns a nonce for use in an REST API request.
 * Nonce is 16 random bytes generated using crypto.randomBytes
 */
export function getNonce () {
  const n = randomBytes(16).toString('base64')

  log(`generated nonce value of "${n}"`)

  return n
}

/**
 * Returns a SHA512 based HMAC to include with REST API requests
 * @param uri
 * @param apisecret
 */
export function getHmac (uri: string, apisecret: string) {
  log(`generate hmac for uri "${uri}"`)

  const hmac = createHmac('sha512', new Buffer(apisecret)).update(uri).digest('hex')

  log(`generated hmac of "${hmac}" for request url "${uri}"`)

  return hmac
}
