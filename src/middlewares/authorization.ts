import Koa from 'koa'
import type { KoaContext } from '../types/koa'

const ACCESS_TOKEN = '_access_token'

export default function authorization() {
  return async function authorization(ctx: KoaContext, next: Koa.Next) {
    const accessToken = ctx.cookies.get(ACCESS_TOKEN)
    ctx.header.authorization = `Bearer ${accessToken}`
    return next()
  }
}
