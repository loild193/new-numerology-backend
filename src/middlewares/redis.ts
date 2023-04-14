import Koa from 'koa'
import { getReasonPhrase, StatusCodes } from 'http-status-codes'
import { createClient, RedisClientType } from 'redis'
import config from '../config'
import { KoaContext } from '../types/koa'

const CACHING_TIME = 300 // 5 minutes in second

let redisClient: RedisClientType | null = null

const redisUrl = `redis://:${config.redisAuthPassword}@${config.redisHost}:${config.redisPort}`

export const initRedisClient = async () => {
  redisClient = createClient({
    name: 'backend',
    url: redisUrl,
    database: config.redisDbForCaching,
  })
  redisClient.on('error', (error) => console.log(`Error : ${error}`))

  await redisClient.connect()
  console.log(`Connected to Redis server: ${config.redisHost}:${config.redisPort}/${config.redisDbForCaching} database`)
}

export const redisMiddleware = {
  getCached: async (ctx: KoaContext, next: Koa.Next) => {
    const redisKey = ctx.params.id
    console.log('redisKey', redisKey)
    try {
      const cachedResult = await redisClient!.get(redisKey as string)
      if (cachedResult) {
        ctx.status = StatusCodes.OK
        ctx.body = { success: true, hit: true, result: JSON.parse(cachedResult) }
      } else {
        return next()
      }
    } catch (error) {
      console.error('[getCachedFromRedis]', error)
      ctx.status = StatusCodes.INTERNAL_SERVER_ERROR
      ctx.body = { success: false, message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) }
    }
  },
  caching: async (key: string, data: any) => {
    await redisClient!.set(key, JSON.stringify(data), {
      EX: CACHING_TIME,
      NX: true,
    })
  },
  delCache: async (key: string) => {
    await redisClient!.del(key)
  },
}
