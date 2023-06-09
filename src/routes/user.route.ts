import Router from '@koa/router'
import * as userController from '../controllers/user.controller'

const router = new Router()

router.get('/api/v1/users', userController.listUser)
router.get('/api/v1/users/:id', userController.detailUser)
router.put('/api/v1/users/:id', userController.updateUser)
router.delete('/api/v1/users/:id', userController.deleteUser)
router.post('/api/v1/users/search-numerology', userController.searchNumerology)
router.put('/api/v1/users/:id/search-amount-left', userController.updateSearchAmountLeft)
router.get('/api/v1/users/:id/search-numerology', userController.listSearchNumerology)

export default router
