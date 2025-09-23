import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { toyRoutes } from './api/toy/toy.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'
import bcrypt from 'bcrypt'
import { dbService } from './services/db.service.js'
import http from 'http'
import { Server as IOServer } from 'socket.io'
import { setIO } from './services/socket.service.js'
import { logger } from './services/logger.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

logger.info('server.js loaded...')

const app = express()

console.log('ALLOWED_ORIGINS=', process.env.ALLOWED_ORIGINS)

if (process.env.NODE_ENV === 'production') {
    const allowlist = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    if (allowlist.length) {
        app.use(cors({ origin: allowlist, credentials: true }))
    }
} else {
    const corsOptions = {
        origin: [
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            'http://127.0.0.1:3000',
            'http://localhost:3000'
        ],
        credentials: true
    }
    app.use(cors(corsOptions))
}

app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))
app.use('/api/toy', toyRoutes)
app.use('/api/review', reviewRoutes)

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
    console.log('__dirname: ', __dirname)
}

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { carRoutes } from './api/car/car.routes.js'

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/car', carRoutes)

app.get('/*all', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

const httpServer = http.createServer(app)

const clientOrigins =
    process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
        : ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://localhost:3000']

const io = new IOServer(httpServer, {
    cors: { origin: clientOrigins.length ? clientOrigins : false, credentials: true }
})
setIO(io)

io.on('connection', socket => {
    socket.on('room:join', room => { if (room) socket.join(room) })
    socket.on('chat:send', ({ room, msg }) => { if (room && msg) io.to(room).emit('chat:new', msg) })
    socket.on('chat:typing', ({ room, user, isTyping }) => { if (room) socket.to(room).emit('chat:typing', { user, isTyping }) })
})

const port = process.env.PORT || 3030
httpServer.listen(port, () => {
    logger.info('Server is running on port: ' + port)
})

async function ensureAdmin() {
    const col = await dbService.getCollection('user')
    const hash = await bcrypt.hash('admin123', 10)
    await col.updateOne(
        { username: 'admin' },
        { $set: { username: 'admin', password: hash, fullname: 'Admin', isAdmin: true, score: 0 } },
        { upsert: true }
    )
}
ensureAdmin().catch(err => console.log('ensureAdmin failed', err))
