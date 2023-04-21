import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import type { KoaContext } from '../types/koa'
import { ERROR_CODE } from '../types/error'
import { isEmail } from '../utils/validate'
import { ROLE, UserModel } from '../models/user'
import { nanoid } from 'nanoid'

export const signUp = async (ctx: KoaContext) => {
  const { phone, email, username } = ctx.request.body as { phone?: string; email?: string; username: string }

  if (!username) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['username'],
        innererror: {},
      },
    }
    return
  }

  if (!phone && !email) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['phone', 'email'],
        innererror: {},
      },
    }
    return
  }

  if (email && !isEmail(email)) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['email'],
        innererror: {},
      },
    }
    return
  }

  try {
    const createUserBody: Record<string, string | number> = {
      id: nanoid(),
      username,
      role: ROLE.USER,
    }
    if (phone) {
      createUserBody.phone = phone
    }
    if (email) {
      createUserBody.email = email
    }
    const createUserRecordResponse = await UserModel.create(createUserBody)
    const response = {
      id: createUserRecordResponse.id,
      username: createUserRecordResponse.username,
      phone: createUserRecordResponse.phone,
      email: createUserRecordResponse.email,
    }

    ctx.status = StatusCodes.CREATED
    ctx.body = { success: true, response }
  } catch (error) {
    console.log('[signUp] Error:', error)
    ctx.status = StatusCodes.INTERNAL_SERVER_ERROR
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        target: [],
        innererror: {},
      },
    }
  }
}

export const signIn = async (ctx: KoaContext) => {
  ctx.status = StatusCodes.OK
  ctx.body = {
    success: true,
    result: JSON.stringify(ctx.request.header),
    cf_ip: ctx.request.header['cf-connecting-ip'],
    ip: ctx.request.ip,
  }
}

export const changePassword = async (ctx: KoaContext) => {
  ctx.status = StatusCodes.OK
  ctx.body = {
    success: true,
    result: JSON.stringify(ctx.request.header),
    cf_ip: ctx.request.header['cf-connecting-ip'],
    ip: ctx.request.ip,
  }
}
