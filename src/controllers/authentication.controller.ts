import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import config from '../config'
import type { KoaContext } from '../types/koa'
import { ERROR_CODE } from '../types/error'
import { ROLE, UserModel } from '../models/user'
import extendedDayJs from '../utils/dayjs'
import { signToken } from '../utils/jwt'
import { isEmail } from '../utils/validate'

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
      createUserBody.email = email.trim().toLowerCase()
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
  const { phone, email, password } = ctx.request.body as { phone?: string; email?: string; password: string }

  if (!password) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['password'],
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

  const findCondition: Record<string, string> = {}
  try {
    if (phone) {
      findCondition.phone = phone
    } else if (email) {
      findCondition.email = email.trim().toLowerCase()
    }

    const user = await UserModel.findOne({ ...findCondition }, { userId: 1, password: 1, role: 1 })

    if (!user || Object.keys(user).length === 0) {
      ctx.status = StatusCodes.BAD_REQUEST
      ctx.body = {
        error: {
          code: ERROR_CODE.NOT_FOUND,
          message: 'User not existed',
          target: ['phone', 'email'],
          innererror: {},
        },
      }

      return
    }

    const isValidManagerPassword = bcrypt.compareSync(password, user.password)
    if (!isValidManagerPassword) {
      ctx.status = StatusCodes.BAD_REQUEST
      ctx.body = {
        error: {
          code: ERROR_CODE.BAD_REQUEST,
          message: 'Invalid parameters',
          target: ['password'],
          innererror: {},
        },
      }
      return
    }

    const jwtPayload = { id: user.userId, role: user.role }
    const accessToken = signToken({ data: jwtPayload, key: config.jwtSecretKey })
    if (!accessToken) {
      ctx.status = StatusCodes.BAD_REQUEST
      ctx.body = {
        error: {
          code: ERROR_CODE.BAD_REQUEST,
          message: 'Cannot sign token',
          target: ['accessToken'],
          innererror: {},
        },
      }
      return
    }

    ctx.status = StatusCodes.OK
    ctx.body = { success: true, response: { accessToken, role: user.role } }
  } catch (error) {
    console.log('[signIn] Error:', error)
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

export const changePassword = async (ctx: KoaContext) => {
  const { phone, email, newPassword } = ctx.request.body as { phone?: string; email?: string; newPassword: string }

  if (!newPassword) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['newPassword'],
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

  try {
    const foundUserRecord = await UserModel.findOne({ userId: ctx.user.id })
    if (!foundUserRecord || Object.keys(foundUserRecord).length === 0) {
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
    if ((email && foundUserRecord.email !== email.trim().toLowerCase()) || (phone && foundUserRecord.phone !== phone)) {
      ctx.status = StatusCodes.BAD_REQUEST
      ctx.body = {
        error: {
          code: ERROR_CODE.INVALID_PARAMETER,
          message: 'Invalid user',
          target: ['ctx.user.id, email, phone'],
          innererror: {},
        },
      }
      return
    }
  } catch (error) {
    console.log('[changePassword] Error:', error)
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
    const updateUserBody: Record<string, string | number> = {}

    const salt = await bcrypt.genSalt(config.authSaltValue)
    const hashedPassword = bcrypt.hashSync(newPassword, salt)
    const currentTimestamp = extendedDayJs.utc().unix()

    updateUserBody.password = hashedPassword
    updateUserBody.updatedAt = currentTimestamp
    updateUserBody.updatedBy = ctx.user.id

    const updatedUserResult = await UserModel.findOneAndUpdate({ userId: ctx.user.id }, updateUserBody)
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
      phone: updatedUserResult.phone,
      email: updatedUserResult.email,
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
