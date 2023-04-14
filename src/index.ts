'use strict'

require('dotenv').config()

import Koa from 'koa'
import bodyParser from 'koa-body'
import json from 'koa-json'
import cors from '@koa/cors'
import jwt from 'koa-jwt'
import jsonwebtoken, { TokenExpiredError } from 'jsonwebtoken'
import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import logger from 'koa-pino-logger'
import requestReceived from 'request-received'
import responseTime from 'koa-better-response-time'
import requestId from 'koa-better-request-id'
import config from './config'
import initializeDBConnection from './database'
import indexRouter from './routes/index.route'
import debugRouter from './routes/debug.route'
import Redis, { initRedisClient } from './utils/cache'

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
    path: ['/', '/healthcheck', '/api/v1/debug', '/api/v1/debug-limit-ip'],
  }),
)

// Verify access token
app.use((ctx, next) => {
  try {
    const authorizationHeader = ctx.request?.header?.authorization
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.split(' ')[1]
      if (token) {
        jsonwebtoken.verify(token, config.jwtSecretKey, function (err, decoded) {
          if (err) {
            if (err.name === TokenExpiredError.name) {
              ctx.status = StatusCodes.BAD_REQUEST
              ctx.body = { success: false, result: null, message: err.message }
            } else {
              ctx.status = StatusCodes.BAD_REQUEST
              ctx.body = { success: false, result: null, message: err.message }
            }
          } else {
            ctx.user = {
              userId: (decoded as { userId: string }).userId,
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

// middleware functions
app.use(indexRouter.middleware())

app.listen(config.serverPort, () => {
  console.log(`ready - started server on 0.0.0.0:${config.serverPort}, url: http://localhost:${config.serverPort}`)
})
