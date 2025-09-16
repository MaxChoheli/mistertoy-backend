import fs from 'fs'

const logsDir = './logs'
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir)

export const logger = {
    debug(...args) { if (process.env.NODE_ENV === 'production') return; _doLog('DEBUG', ...args) },
    info(...args) { _doLog('INFO', ...args) },
    warn(...args) { _doLog('WARN', ...args) },
    error(...args) { _doLog('ERROR', ...args) },
}

function _getTime() { return new Date().toLocaleString('he') }
function _isError(e) { return e && e.stack && e.message }
function _doLog(level, ...args) {
    const strs = args.map(arg => {
        if (typeof arg === 'string') return arg
        if (_isError(arg)) return `${arg.message}\n${arg.stack}`
        try { return JSON.stringify(arg) } catch { return String(arg) }
    })
    const line = `${_getTime()} - ${level} - ${strs.join(' | ')}\n`
    console.log(line)
    fs.appendFile('./logs/backend.log', line, () => { })
}
