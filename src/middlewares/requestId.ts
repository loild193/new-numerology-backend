import Koa from 'koa'
import { nanoid } from 'nanoid'
import type { KoaContext } from '../types/koa'

export default function requestId() {
  return async function requestId(ctx: KoaContext, next: Koa.Next) {
    const requestId = nanoid()
    ctx.request_id = requestId
    ctx.header['X-Request-Id'] = requestId
    return next().then(() => {
      ctx.set('X-Request-Id', requestId)
    })
  }
}
