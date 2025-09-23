import { toyService } from './toy.service.js'
import { logger } from '../../services/logger.service.js'

export async function getToys(req, res) {
    try {
        const filterBy = {
            txt: req.query.txt || '',
            inStock: parseInStock(req.query.inStock),
            labels: parseLabels(req.query.labels),
            sortBy: req.query.sortBy || 'name',
            sortDir: Number(req.query.sortDir) === -1 ? -1 : 1
        }
        const toys = await toyService.query(filterBy)
        res.json(toys)
    } catch (err) {
        logger.error('Failed to get toys', err)
        res.status(500).send({ err: 'Failed to get toys' })
    }
}

export async function getToyById(req, res) {
    try {
        const toy = await toyService.getById(req.params.id)
        res.json(toy)
    } catch (err) {
        logger.error('Failed to get toy', err)
        res.status(500).send({ err: 'Failed to get toy' })
    }
}

export async function addToy(req, res) {
    try {
        const saved = await toyService.add(req.body)
        res.json(saved)
    } catch (err) {
        logger.error('Failed to add toy', err)
        res.status(500).send({ err: 'Failed to add toy' })
    }
}

export async function updateToy(req, res) {
    try {
        const toy = { ...req.body, _id: req.params.id }
        const saved = await toyService.update(toy)
        res.json(saved)
    } catch (err) {
        logger.error('Failed to update toy', err)
        res.status(500).send({ err: 'Failed to update toy' })
    }
}

export async function removeToy(req, res) {
    try {
        const deletedCount = await toyService.remove(req.params.id)
        res.send(String(deletedCount))
    } catch (err) {
        logger.error('Failed to remove toy', err)
        res.status(500).send({ err: 'Failed to remove toy' })
    }
}

export async function addToyMsg(req, res) {
    try {
        const msg = {
            txt: req.body.txt,
            by: req.loggedinUser,
            createdAt: Date.now()
        }
        const saved = await toyService.addToyMsg(req.params.id, msg)
        res.json(saved)
    } catch (err) {
        logger.error('Failed to add toy msg', err)
        res.status(500).send({ err: 'Failed to add toy msg' })
    }
}

export async function removeToyMsg(req, res) {
    try {
        const removedId = await toyService.removeToyMsg(req.params.id, req.params.msgId)
        res.send(removedId)
    } catch (err) {
        logger.error('Failed to remove toy msg', err)
        res.status(500).send({ err: 'Failed to remove toy msg' })
    }
}

function parseInStock(val) {
    if (val === undefined) return undefined
    if (val === 'true') return true
    if (val === 'false') return false
    return undefined
}

function parseLabels(val) {
    if (!val) return []
    if (Array.isArray(val)) return val
    const s = String(val).trim()
    if (!s) return []
    return s.split(',').map(x => x.trim()).filter(x => x)
}
