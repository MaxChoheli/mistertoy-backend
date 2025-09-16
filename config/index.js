import configProd from './prod.js'
import configDev from './dev.js'

const base = process.env.NODE_ENV === 'production' ? configProd : configDev

const origins = ((process.env.ORIGIN ?? base.origins) || '')
    .toString()
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

export const config = {
    ...base,
    isGuestMode: true,
    port: Number(process.env.PORT) || base.port || 3030,
    dbURL: process.env.MONGO_URL || base.dbURL || '',
    dbName: process.env.DB_NAME || base.dbName || '',
    origins,
}
export default config
