import { logger } from '../services/logger.service.js'
import { authService } from '../api/auth/auth.service.js'

export async function requireAuth(req, res, next) {
    if (!req || !req.cookies || !req.cookies.loginToken) return res.status(401).send('Not Authenticated')
    const loggedinUser = authService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Not Authenticated')
    req.loggedinUser = loggedinUser
    next()
}

export async function requireAdmin(req, res, next) {
    if (!req || !req.cookies || !req.cookies.loginToken) return res.status(401).send('Not Authenticated')
    const loggedinUser = authService.validateToken(req.cookies.loginToken)
    if (!loggedinUser || !loggedinUser.isAdmin) {
        logger.warn('Admin action blocked')
        return res.status(403).end('Not Authorized')
    }
    req.loggedinUser = loggedinUser
    next()
}
