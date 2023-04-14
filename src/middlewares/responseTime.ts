import Koa from 'koa'
import type { KoaContext } from '../types/koa'

export default function responseTime() {
  return function responseTime(ctx: KoaContext, next: Koa.Next) {
    const start = process.hrtime()
    return next().then(() => {
      const delta = process.hrtime(start)
      let formattedDelta = delta[0] * 1000 + delta[1] / 1000000
      formattedDelta = Math.round(formattedDelta)
      ctx.set('X-Response-Time', `${formattedDelta}ms`)
    })
  }
}
