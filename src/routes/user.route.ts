import Router from '@koa/router'
import * as userController from '../controllers/user.controller'

const router = new Router()

router.get('/api/v1/users', userController.listUser)
router.get('/api/v1/users/:id', userController.detailUser)
router.put('/api/v1/users/:id', userController.updateUser)
router.post('/api/v1/users/search-numerology', userController.searchNumerology)
router.put('/api/v1/users/:id/update-search-amount-left', userController.updateSearchAmountLeft)

export default router
