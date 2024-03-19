import { Router } from 'express'
import { healthcheck } from '../../../controllers/api/v1/healthcheck.controller.js'

const router = Router()

router.route('/').get(healthcheck)

export default router
