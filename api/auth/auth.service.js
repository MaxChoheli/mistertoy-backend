import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'
import { userService } from '../user/user.service.js'
import { logger } from '../../services/logger.service.js'

export const authService = {
    signup,
    login,
    getLoginToken,
    validateToken
}

const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')

async function signup(username, password, fullname) {
    const existing = await userService.getByUsername(username)
    if (existing) throw new Error('Username already taken')
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const user = {
        username,
        password: hash,
        fullname,
        isAdmin: false,
        score: 100
    }
    const saved = await userService.add(user)
    delete saved.password
    return saved
}

async function login(username, password) {
    const user = await userService.getByUsername(username)
    if (!user) throw new Error('Invalid username or password')
    const match = await bcrypt.compare(password, user.password)
    if (!match) throw new Error('Invalid username or password')
    delete user.password
    return user
}

function getLoginToken(user) {
    const userInfo = { _id: user._id, fullname: user.fullname, isAdmin: user.isAdmin }
    return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
    try {
        const json = cryptr.decrypt(loginToken)
        const loggedinUser = JSON.parse(json)
        return loggedinUser
    } catch (err) {
        logger.error('Invalid login token ' + err)
        return null
    }
}
