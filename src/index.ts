'use strict'

require('dotenv').config()

import Koa from 'koa'
import bodyParser from 'koa-body'
import json from 'koa-json'
import cors from '@koa/cors'
import jwt from 'koa-jwt'
import jsonwebtoken from 'jsonwebtoken'
import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import logger from 'koa-pino-logger'
import requestReceived from 'request-received'
import responseTime from 'koa-better-response-time'
import requestId from 'koa-better-request-id'
import config from './config'
import initializeDBConnection from './database'
import indexRouter from './routes/index.route'
import debugRouter from './routes/debug.route'
import authenticationRouter from './routes/authentication.route'
import userRouter from './routes/user.route'
import Redis, { initRedisClient } from './utils/cache'
import { ERROR_CODE } from './types/error'

initializeDBConnection()

const app = new Koa()

// init redis connection
Redis.init(initRedisClient)

app.use(
  logger({
    level: 'error',
  }),
)

// adds request received hrtime and date symbols to request object
app.use(requestReceived)

// adds `X-Response-Time` header to responses
app.use(responseTime())

// adds or re-uses `X-Request-Id` header
app.use(requestId())

app.use(bodyParser())
app.use(
  cors({
    credentials: true,
  }),
)
app.use(json())

app.use(
  jwt({ secret: config.jwtSecretKey, cookie: '_access_token' }).unless({
    path: ['/', '/healthcheck', '/api/v1/debug', '/api/v1/debug-limit-ip', '/api/v1/sign-up', '/api/v1/sign-in'],
  }),
)

// Verify access token
app.use((ctx, next) => {
  try {
    const authorizationHeader = ctx.request?.header?.authorization
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.split(' ')[1]
      if (token) {
        jsonwebtoken.verify(token, config.jwtSecretKey, function (err, decoded: { id: number; role: number }) {
          if (err) {
            ctx.status = StatusCodes.UNAUTHORIZED
            ctx.body = {
              code: ERROR_CODE.UNAUTHORIZED,
              message: err.message,
              target: [],
              innererror: {},
            }
          } else {
            ctx.user = {
              userId: decoded.id,
              role: decoded.role,
            }
          }
        })
      }
    }

    // no token found -> this is authentication API
    return next()
  } catch (error) {
    console.error('[Verify JWT] Error: ', error)
    ctx.status = StatusCodes.UNAUTHORIZED
    ctx.body = { success: false, data: null, message: getReasonPhrase(StatusCodes.UNAUTHORIZED) }
    return
  }
})

app.use(indexRouter.routes()).use(indexRouter.allowedMethods())
app.use(debugRouter.routes()).use(debugRouter.allowedMethods())
app.use(authenticationRouter.routes()).use(authenticationRouter.allowedMethods())
app.use(userRouter.routes()).use(userRouter.allowedMethods())

// middleware functions
app.use(indexRouter.middleware())

app.listen(config.serverPort, () => {
  console.log(`ready - started server on 0.0.0.0:${config.serverPort}, url: http://localhost:${config.serverPort}`)
})
