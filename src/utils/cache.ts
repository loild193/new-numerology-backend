import { createClient, RedisClientType, SetOptions } from 'redis'
import config from '../config'

const CACHING_TIME = 300 // 5 minutes in second

export enum CACHE_PREFIX {
  SNEAKER_DETAIL = 'cached_sneaker_info_',
  STAKING_BALANCE = 'staking_balance_',
}

const redisUrl = `redis://:${config.redisAuthPassword}@${config.redisHost}:${config.redisPort}`

export const initRedisClient = async () => {
  let redisClient: RedisClientType | null = null
  redisClient = createClient({
    name: 'backend',
    url: redisUrl,
    database: config.redisDbForCaching,
  })
  redisClient.on('error', (error) => console.log(`Error : ${error}`))

  await redisClient.connect()
  console.log(`Connected to Redis server: ${config.redisHost}:${config.redisPort}/${config.redisDbForCaching} database`)

  return redisClient
}

class Redis {
  static redisClient: RedisClientType | null

  constructor() {
    Redis.redisClient = null
  }

  static init = async (callback: () => Promise<RedisClientType>) => {
    this.redisClient = await callback.bind(this)()
  }

  static isKeyExistedInCache = async (key: string): Promise<any> => {
    try {
      const isKeyExistedInCache = await this.redisClient!.exists(key as string)
      console.log('isKeyExistedInCache', isKeyExistedInCache)

      if (isKeyExistedInCache) {
        return {
          isExisted: true,
          key,
        }
      }
      return {
        isExisted: false,
        key,
      }
    } catch (error) {
      console.error('[getCached]', error)
      throw new Error('Internal Server Error')
    }
  }

  static getCached = async (key: string): Promise<any> => {
    try {
      const cachedResult = await this.redisClient!.get(key as string)
      if (cachedResult) {
        return JSON.parse(cachedResult)
      }
      return null
    } catch (error) {
      console.error('[getCached]', error)
      throw new Error('Internal Server Error')
    }
  }

  static caching = async (key: string, data: any, options: any = {}): Promise<void> => {
    try {
      await this.redisClient!.set(key, JSON.stringify(data), {
        EX: CACHING_TIME,
        NX: true,
        ...options,
      })
    } catch (error) {
      console.error('[caching]', error)
      throw new Error('Internal Server Error')
    }
  }

  static delCache = async (key: string): Promise<void> => {
    try {
      await this.redisClient!.del(key)
    } catch (error) {
      console.error('[delCache]', error)
      throw new Error('Internal Server Error')
    }
  }
}

export default Redis
