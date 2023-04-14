import { StatusCodes } from 'http-status-codes'
import type { KoaContext } from '../types/koa'

export const debug = async (ctx: KoaContext) => {
  ctx.status = StatusCodes.OK
  ctx.body = { success: true, result: JSON.stringify(ctx.request.header) }
}

export const debugLimitIp = async (ctx: KoaContext) => {
  ctx.status = StatusCodes.OK
  ctx.body = {
    success: true,
    result: JSON.stringify(ctx.request.header),
    cf_ip: ctx.request.header['cf-connecting-ip'],
    ip: ctx.request.ip,
  }
}
