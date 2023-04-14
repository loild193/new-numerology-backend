import Router from '@koa/router'
import { RateLimit } from 'koa2-ratelimit'
import * as debugController from '../controllers/debug.controller'

const debugLimiter = RateLimit.middleware({
  interval: { min: 1 },
  max: 10,
  message: 'Too many requests. Please try again later.',
  keyGenerator: async (ctx) => {
    const vercelIp = ctx.request.header['x-vercel-proxied-for']
    let ip = vercelIp ?? ctx.request.header['cf-connecting-ip']
    if (!ip) {
      ip = ctx.request.ip
    }
    return `${ip}`
  },
})

const router = new Router()

router.get('/api/v1/debug', debugController.debug)
router.get('/api/v1/debug-limit-ip', debugLimiter, debugController.debugLimitIp)

export default router
