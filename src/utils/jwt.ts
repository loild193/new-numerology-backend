import jwt, { SignOptions } from 'jsonwebtoken'
import config from '../config'

interface ISignTokenInput {
  data: object
  key: string
  options?: SignOptions
}

interface IDecodeTokenInput {
  token: string
  key: string
}

export interface IDecodeTokenData {
  id: string
  iat: number
  exp: number
}

export function signToken({ data, key, options = {} }: ISignTokenInput): string | null {
  if (!key) {
    console.error('[signToken] Invalid key')
    return null
  }
  try {
    return jwt.sign(data, key, { expiresIn: config.jwtAccessTokenExpiresIn, ...options })
  } catch (error) {
    console.error('[signToken]', error)
    return null
  }
}

export function decode<T>({ token, key }: IDecodeTokenInput): T | null {
  if (!key) {
    console.error('[verify] Invalid key')
    return null
  }
  try {
    return jwt.decode(token) as T
  } catch (error) {
    console.error('[verify]', error)
    return null
  }
}

export function verify<T>({ token, key }: IDecodeTokenInput): T | null {
  if (!key) {
    console.error('[verify] Invalid key')
    return null
  }
  try {
    return jwt.verify(token, key) as T
  } catch (error) {
    console.error('[verify]', error)
    return null
  }
}
