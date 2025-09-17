import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { toyRoutes } from './api/toy/toy.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'
import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { logger } from './services/logger.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const origins = (process.env.ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)

app.set('trust proxy', 1)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true')
    next()
})
app.use(cors({
    origin: function (origin, cb) {
        if (!origin) return cb(null, true)
        if (origins.length === 0) return cb(null, true)
        if (origins.includes(origin)) return cb(null, true)
        return cb(new Error('Not allowed by CORS'))
    },
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.get('/healthz', (req, res) => res.status(200).send('ok'))

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/toy', toyRoutes)
app.use('/api/review', reviewRoutes)

    ; (async () => {
        try {
            const mod = await import('./api/car/car.routes.js')
            if (mod && mod.carRoutes) app.use('/api/car', mod.carRoutes)
        } catch { }
    })()

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
    app.get(/^(?!\/api\/).*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
    })
}

const port = process.env.PORT || 3030
app.listen(port, '0.0.0.0', () => logger.info(`Server listening on ${port}`))
