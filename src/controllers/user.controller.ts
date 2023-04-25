import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import bcrypt from 'bcryptjs'
import config from '../config'
import { ROLE, UserModel } from '../models/user'
import type { KoaContext } from '../types/koa'
import { ERROR_CODE } from '../types/error'

enum LIST_USER_FILTER {
  ALL = 'all',
  HAS_ACCOUNT = 'has_account',
  NOT_HAVE_ACCOUNT = 'not_have_account',
}

const DEFAULT_SEARCH_AMOUNT_LEFT = 50
const DEFAULT_START_PAGE = 1
const DEFAULT_ITEM_PER_PAGE = 10

// search by phone/email/username & filter with user has account or not
// /api/v1/users?keyword=xxx&filter=all
export const listUser = async (ctx: KoaContext) => {
  const { keyword, filter } = ctx.request.query as {
    keyword: string
    filter: LIST_USER_FILTER
    startPage: string
    limit: string
  }
  const startPage = Number(ctx.request.query.startPage || DEFAULT_START_PAGE) - 1
  const limit = Number(ctx.request.query.limit || DEFAULT_ITEM_PER_PAGE)

  if (filter && !Object.values(LIST_USER_FILTER).includes(filter)) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['filter'],
        innererror: {},
      },
    }
    return
  }

  if (startPage < 0 || Number.isNaN(startPage)) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['startPage'],
        innererror: {},
      },
    }
    return
  }

  if (Number.isNaN(limit)) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['limit'],
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
    console.log('[listUser] Error:', error)
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
    const findCondition: Record<string, any> = {}
    if (keyword) {
      findCondition['$or'] = [{ email: `/${keyword}/i` }, { phone: `/${keyword}/` }, { username: `/${keyword}/i` }]
    }
    if (filter === LIST_USER_FILTER.HAS_ACCOUNT) {
      findCondition.userId = { $ne: null }
    } else if (filter === LIST_USER_FILTER.NOT_HAVE_ACCOUNT) {
      findCondition.userId = { $eq: null }
    }

    const totalRecords = await UserModel.countDocuments(findCondition)
    const totalPages = Math.ceil(totalRecords / limit)

    const users = await UserModel.find(findCondition, null, { skip: startPage * limit, limit })
      .sort({ createdAt: 1 })
      .lean()
      .transform((docs) =>
        docs.map((doc) => ({
          id: doc.id,
          userId: doc.userId,
          username: doc.username,
          phone: doc.phone,
          email: doc.email,
          searchAmountLeft: doc.searchAmountLeft,
          role: doc.role,
        })),
      )

    ctx.status = StatusCodes.OK
    ctx.body = {
      success: true,
      response: users,
      pagination: { startPage: startPage + 1, limit: Number(limit), totalPages, totalRecords },
    }
  } catch (error) {
    console.log('[listUser] Error:', error)
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

export const updateUser = async (ctx: KoaContext) => {
  const { id } = ctx.params as { id: string }
  const { userId, password, searchAmountLeft } = ctx.request.body as {
    userId: string
    password: string
    searchAmountLeft: number
  }

  if (!id || !userId || !password) {
    ctx.status = StatusCodes.BAD_REQUEST
    ctx.body = {
      error: {
        code: ERROR_CODE.INVALID_PARAMETER,
        message: 'Invalid parameters',
        target: ['id', 'userId', 'password'],
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
    // find valid admin
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
        code: ERROR_CODE.SERVER_ERROR,
        message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        target: [],
        innererror: {},
      },
    }
  }

  try {
    // find valid user
    const foundUserRecord = await UserModel.findOne({ id })
    if (!foundUserRecord || Object.keys(foundUserRecord).length === 0) {
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
        code: ERROR_CODE.SERVER_ERROR,
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

    updateUserBody.password = hashedPassword
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
      userId,
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
        code: ERROR_CODE.SERVER_ERROR,
        message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        target: [],
        innererror: {},
      },
    }
  }
}
