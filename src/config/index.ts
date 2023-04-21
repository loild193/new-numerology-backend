require('dotenv').config()

type GlobalConfig = {
  serverPort: number

  mongoDbHost: string
  mongoDbPort: number
  mongoDbUsername: string
  mongoDbPassword: string
  mongoDbDatabase: string

  redisHost: string
  redisPort: number
  redisAuthPassword: string
  redisDbForCaching: number

  adminToken: string
  jwtSecretKey: string
  jwtAccessTokenExpiresIn: number
  authSaltValue: number
}

const DEFAULT_SERVER_PORT = 9000
const DEFAULT_MONGODB_PORT = 27017
const DEFAULT_REDIS_PORT = 6379
const DEFAULT_REDIS_DB_FOR_CACHING = 2
const DEFAULT_JWT_ACCESS_TOKEN_EXPIRES_IN = 86400 // 1 day in seconds
const DEFAULT_AUTH_SALT_VALUE = 6

if (!process.env.MONGODB_HOST) {
  console.log('Missing MONGODB_HOST in config')
  process.exit(1)
}

if (!process.env.MONGODB_USERNAME) {
  console.log('Missing MONGODB_USERNAME in config')
  process.exit(1)
}

if (!process.env.MONGODB_PASSWORD) {
  console.log('Missing MONGODB_PASSWORD in config')
  process.exit(1)
}

if (!process.env.MONGODB_DATABASE) {
  console.log('Missing MONGODB_DATABASE in config')
  process.exit(1)
}

if (!process.env.REDIS_HOST) {
  console.log('Missing REDIS_HOST in config')
  process.exit(1)
}

if (!process.env.X_ADMIN_TOKEN) {
  console.log('Missing X_ADMIN_TOKEN in config')
  process.exit(1)
}

if (!process.env.JWT_SECRET_KEY) {
  console.log('Missing JWT_SECRET_KEY in config')
  process.exit(1)
}

const GLOBAL_CONFIG: GlobalConfig = {
  serverPort: Number.isNaN(Number(process.env.SERVER_PORT)) ? DEFAULT_SERVER_PORT : Number(process.env.SERVER_PORT),

  mongoDbHost: process.env.MONGODB_HOST,
  mongoDbPort: Number.isNaN(Number(process.env.MONGODB_PORT)) ? DEFAULT_MONGODB_PORT : Number(process.env.MONGODB_PORT),
  mongoDbUsername: process.env.MONGODB_USERNAME,
  mongoDbPassword: process.env.MONGODB_PASSWORD,
  mongoDbDatabase: process.env.MONGODB_DATABASE,

  redisHost: process.env.REDIS_HOST,
  redisPort: Number.isNaN(Number(process.env.REDIS_PORT)) ? DEFAULT_REDIS_PORT : Number(process.env.REDIS_PORT),
  redisAuthPassword: process.env.REDIS_AUTH_PASSWORD ?? '',
  redisDbForCaching: Number.isNaN(Number(process.env.REDIS_DATABASE_FOR_CACHING))
    ? DEFAULT_REDIS_DB_FOR_CACHING
    : Number(process.env.REDIS_DATABASE_FOR_CACHING),

  adminToken: process.env.X_ADMIN_TOKEN,
  jwtSecretKey: process.env.JWT_SECRET_KEY,
  jwtAccessTokenExpiresIn: Number.isNaN(Number(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN))
    ? DEFAULT_JWT_ACCESS_TOKEN_EXPIRES_IN
    : Number(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN),
  authSaltValue: Number.isNaN(Number(process.env.AUTH_SALT_VALUE))
    ? DEFAULT_AUTH_SALT_VALUE
    : Number(process.env.AUTH_SALT_VALUE),
}

export default GLOBAL_CONFIG
