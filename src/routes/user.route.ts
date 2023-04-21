import Router from '@koa/router'
import * as userController from '../controllers/user.controller'

const router = new Router()

router.put('/api/v1/users/id', userController.updateUser)

export default router
