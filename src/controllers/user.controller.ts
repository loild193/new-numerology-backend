import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import type { KoaContext } from '../types/koa'
import { ERROR_CODE } from '../types/error'
import { ROLE, UserModel } from '../models/user'
import bcrypt from 'bcryptjs'
import extendedDayJs from '../utils/dayjs'
import config from '../config'

const DEFAULT_SEARCH_AMOUNT_LEFT = 50

export const updateUser = async (ctx: KoaContext) => {
  const { id } = ctx.request.query as { id: string }
  const { userId, password, searchAmountLeft } = ctx.request.body as {
    userId: number
    password: string
    searchAmountLeft: number
  }

  if (!id || !userId || !password) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['id'],
        innererror: {},
      },
    }
    return
  }

  if (Number.isNaN(Number(userId))) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['userId'],
        innererror: {},
      },
    }
    return
  }

  if (searchAmountLeft && Number.isNaN(Number(searchAmountLeft))) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['searchAmountLeft'],
        innererror: {},
      },
    }
    return
  }

  if (!ctx.user?.id) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.UNAUTHORIZED,
        message: 'Invalid user',
        target: ['ctx.user.id'],
        innererror: {},
      },
    }
    return
  }

  if (!ctx.user?.role || ctx.user.role !== ROLE.ADMIN) {
    ctx.status = StatusCodes.FORBIDDEN
    ctx.body = {
      error: {
        code: ERROR_CODE.UNAUTHORIZED,
        message: 'Permission denied',
        target: ['role'],
        innererror: {},
      },
    }
    return
  }

  try {
    const foundUserRecord = await UserModel.findOne({ userId: ctx.user.id })
    if (!foundUserRecord || Object.keys(foundUserRecord).length === 0 || foundUserRecord.role !== ROLE.ADMIN) {
      ctx.status = StatusCodes.BAD_REQUEST
      ctx.body = {
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'Invalid user',
          target: ['ctx.user.id'],
          innererror: {},
        },
      }
      return
    }
  } catch (error) {
    console.log('[updateUser] Error:', error)
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

  try {
    const foundUserRecord = await UserModel.findOne({ userId })
    if (foundUserRecord && Object.keys(foundUserRecord).length > 0) {
      ctx.status = StatusCodes.BAD_REQUEST
      ctx.body = {
        error: {
          code: ERROR_CODE.ALREADY_EXIST,
          message: 'User is existed',
          target: ['userId'],
          innererror: {},
        },
      }
      return
    }
  } catch (error) {
    console.log('[updateUser] Error:', error)
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

  try {
    const updateUserBody: Record<string, string | number> = {
      userId,
      searchAmountLeft: searchAmountLeft ?? DEFAULT_SEARCH_AMOUNT_LEFT,
    }

    const salt = await bcrypt.genSalt(config.authSaltValue)
    const hashedPassword = bcrypt.hashSync(password, salt)
    const currentTimestamp = extendedDayJs.utc().unix()

    updateUserBody.password = hashedPassword
    updateUserBody.updatedAt = currentTimestamp
    updateUserBody.createdBy = ctx.user.id
    updateUserBody.updatedBy = ctx.user.id

    const updatedUserResult = await UserModel.findOneAndUpdate({ id }, updateUserBody)
    if (!updatedUserResult) {
      ctx.status = StatusCodes.BAD_REQUEST
      ctx.body = {
        error: {
          code: ERROR_CODE.BAD_REQUEST,
          message: 'Cannot update user record',
          target: [],
          innererror: {},
        },
      }
      return
    }

    const response = {
      id: updatedUserResult.id,
      userId: updatedUserResult.userId,
      username: updatedUserResult.username,
      phone: updatedUserResult.phone,
      email: updatedUserResult.email,
      searchAmountLeft: updatedUserResult.searchAmountLeft,
      role: ROLE.USER,
    }

    ctx.status = StatusCodes.OK
    ctx.body = { success: true, response }
  } catch (error) {
    console.log('[updateUser] Error:', error)
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
