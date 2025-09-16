import express from 'express'
import cookieParser from 'cookie-parser'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { toyRoutes } from './api/toy/toy.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'
import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { carRoutes } from './api/car/car.routes.js'
import { logger } from './services/logger.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const isProd = process.env.NODE_ENV === 'production'

const devOrigins = [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
]

const origins = isProd
    ? (process.env.ORIGIN || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : devOrigins

app.set('trust proxy', 1)

app.use((req, res, next) => {
    const origin = req.headers.origin
    if (origin && origins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Credentials', 'true')
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        res.header('Vary', 'Origin')
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
})

app.use(cookieParser())
app.use(express.json())

if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'public')))
} else {
    app.use(express.static('public'))
}

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/car', carRoutes)
app.use('/api/toy', toyRoutes)
app.use('/api/review', reviewRoutes)

app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
})

const port = process.env.PORT || 3030
app.listen(port, () => logger.info(`Server listening on ${port}`))
