import { logger } from '../services/logger.service.js'

export async function log(req, res, next) {
    const path = req.route && req.route.path ? req.route.path : req.originalUrl
    logger.info('Req was made', path)
    next()
}
