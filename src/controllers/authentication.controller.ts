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

const DEFAULT_SEARCH_AMOUNT_LEFT = 50

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
    const foundUserRecord = await UserModel.findOne({
      $or: [{ email }, { phone }, { username }],
    })
    if (foundUserRecord && Object.keys(foundUserRecord).length > 0) {
      ctx.status = StatusCodes.BAD_REQUEST
      ctx.body = {
        error: {
          code: ERROR_CODE.ALREADY_EXIST,
          message: 'User existed',
          target: ['email', 'phone', 'username'],
          innererror: {},
        },
      }
      return
    }
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

// create admin account
export const adminSignUp = async (ctx: KoaContext) => {
  const { phone, email, username, userId, password } = ctx.request.body as {
    phone: string
    email: string
    username: string
    userId: string
    password: string
  }

  if (ctx.request.header['x-admin-token'] !== config.adminToken) {
    ctx.status = StatusCodes.FORBIDDEN
    ctx.body = {
      error: {
        code: ERROR_CODE.UNAUTHORIZED,
        message: 'Permission denied',
        target: [],
        innererror: {},
      },
    }
    return
  }

  if (!username || !phone || !email || !userId || !password) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['phone', 'email', 'username', 'userId', 'password'],
        innererror: {},
      },
    }
    return
  }

  if (!isEmail(email)) {
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
    const foundUserRecord = await UserModel.findOne({
      $or: [{ email }, { phone }, { username }, { userId }],
    })
    if (foundUserRecord && Object.keys(foundUserRecord).length > 0) {
      ctx.status = StatusCodes.BAD_REQUEST
      ctx.body = {
        error: {
          code: ERROR_CODE.ALREADY_EXIST,
          message: 'Admin existed',
          target: ['email', 'phone', 'username'],
          innererror: {},
        },
      }
      return
    }
  } catch (error) {
    console.log('[adminSignup] Error:', error)
    ctx.status = StatusCodes.INTERNAL_SERVER_ERROR
    ctx.body = {
      error: {
        code: ERROR_CODE.SERVER_ERROR,
        message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        target: [],
        innererror: {},
      },
    }
  }

  try {
    const createUserBody: Record<string, string | number> = {
      id: nanoid(),
      userId,
      username,
      role: ROLE.ADMIN,
    }
    const salt = await bcrypt.genSalt(config.authSaltValue)
    const hashedPassword = bcrypt.hashSync(password, salt)

    createUserBody.phone = phone
    createUserBody.email = email.trim().toLowerCase()
    createUserBody.password = hashedPassword

    const createUserRecordResponse = await UserModel.create(createUserBody)
    const response = {
      id: createUserRecordResponse.id,
      userId: createUserRecordResponse.userId,
      username: createUserRecordResponse.username,
      phone: createUserRecordResponse.phone,
      email: createUserRecordResponse.email,
    }

    ctx.status = StatusCodes.CREATED
    ctx.body = { success: true, response }
  } catch (error) {
    console.log('[adminSignup] Error:', error)
    ctx.status = StatusCodes.INTERNAL_SERVER_ERROR
    ctx.body = {
      error: {
        code: ERROR_CODE.SERVER_ERROR,
        message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        target: [],
        innererror: {},
      },
    }
  }
}

export const signIn = async (ctx: KoaContext) => {
  const { userId, password } = ctx.request.body as { userId: string; password: string }

  if (!userId || !password) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['userId', 'password'],
        innererror: {},
      },
    }
    return
  }

  try {
    const user = await UserModel.findOne({ userId })

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
          message: 'Password does not match',
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
    ctx.body = {
      success: true,
      response: { accessToken, userId: user.userId, username: user.username, email: user.email, role: user.role },
    }
  } catch (error) {
    console.log('[signIn] Error:', error)
    ctx.status = StatusCodes.INTERNAL_SERVER_ERROR
    ctx.body = {
      error: {
        code: ERROR_CODE.SERVER_ERROR,
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
        code: ERROR_CODE.SERVER_ERROR,
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
        code: ERROR_CODE.SERVER_ERROR,
        message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        target: [],
        innererror: {},
      },
    }
  }
}

export const createUser = async (ctx: KoaContext) => {
  const { userId, password, searchAmountLeft } = ctx.request.body as {
    userId: string
    password: string
    searchAmountLeft: number
  }
  const { user } = ctx

  if (user?.role !== ROLE.ADMIN) {
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
    // find valid admin
    const foundUserRecord = await UserModel.findOne({ userId: user.id })
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
        code: ERROR_CODE.SERVER_ERROR,
        message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        target: [],
        innererror: {},
      },
    }
  }

  if (!userId || !password) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['userId', 'password'],
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

  try {
    // check if userId iss valid
    const foundUserRecord = await UserModel.findOne({ userId })
    if (foundUserRecord) {
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

    const createUserBody: Record<string, string | number> = {
      id: nanoid(),
      userId,
      role: ROLE.USER,
      username: userId,
      searchAmountLeft: searchAmountLeft ?? DEFAULT_SEARCH_AMOUNT_LEFT,
    }

    // hash password
    const salt = await bcrypt.genSalt(config.authSaltValue)
    const hashedPassword = bcrypt.hashSync(password, salt)

    createUserBody.password = hashedPassword

    const createUserRecordResponse = await UserModel.create(createUserBody)
    const response = {
      userId: createUserRecordResponse.userId,
      id: createUserRecordResponse.id,
      role: createUserRecordResponse.role,
      username: createUserRecordResponse.userId,
      searchAmountLeft: createUserRecordResponse.searchAmountLeft,
    }

    ctx.status = StatusCodes.OK
    ctx.body = { success: true, response }
  } catch (error) {
    console.log('[createUser]', error)
    ctx.status = StatusCodes.INTERNAL_SERVER_ERROR
    ctx.body = {
      error: {
        code: ERROR_CODE.SERVER_ERROR,
        message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        target: [],
        innererror: {},
      },
    }
  }
}
