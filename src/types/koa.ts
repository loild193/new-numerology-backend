import Koa from 'koa'

export type KoaContext = Koa.Context & {
  request_id?: string
  user?: {
    wallet?: string
  }
}
