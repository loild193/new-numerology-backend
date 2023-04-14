import Router from '@koa/router'
import { RateLimit } from 'koa2-ratelimit'
import { StatusCodes } from 'http-status-codes'
import type { KoaContext } from '../types/koa'

const indexLimiter = RateLimit.middleware({
  interval: { min: 1 },
  max: 60,
  keyGenerator: async (ctx) => {
    const vercelIp = ctx.request.header['x-vercel-proxied-for']
    let ip = vercelIp ?? ctx.request.header['cf-connecting-ip']
    if (!ip) {
      ip = ctx.request.ip
    }
    return `${ip}`
  },
})

const heathCheck = async (ctx: KoaContext) => {
  ctx.status = StatusCodes.OK
  ctx.body = { success: true }
}

const router = new Router()

router.get('/', indexLimiter, heathCheck)
router.get('/healthcheck', indexLimiter, heathCheck)

export default router
