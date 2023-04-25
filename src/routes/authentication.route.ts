import Router from '@koa/router'
import * as authenticationController from '../controllers/authentication.controller'

const router = new Router()

router.post('/api/v1/sign-up', authenticationController.signUp)
router.post('/api/v1/admin/sign-up', authenticationController.adminSignUp)
router.post('/api/v1/sign-in', authenticationController.signIn)
router.post('/api/v1/change-password', authenticationController.changePassword)

export default router
