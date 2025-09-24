import { ObjectId } from 'mongodb'
import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

export const toyService = {
    query,
    getById,
    add,
    update,
    remove,
    addToyMsg,
    removeToyMsg,
}

async function query(filterBy = {}) {
    try {
        const criteria = {}
        if (filterBy.txt && String(filterBy.txt).trim()) {
            criteria.name = { $regex: String(filterBy.txt).trim(), $options: 'i' }
        }
        if (typeof filterBy.inStock === 'boolean') criteria.inStock = filterBy.inStock
        if (Array.isArray(filterBy.labels) && filterBy.labels.length > 0) {
            criteria.labels = { $in: filterBy.labels }
        }

        const sortMap = { name: 'name', price: 'price', created: 'createdAt' }
        const sortField = sortMap[filterBy.sortBy] || 'name'
        const sortDir = Number(filterBy.sortDir) === -1 ? -1 : 1

        const col = await dbService.getCollection('toy')
        const toys = await col.find(criteria).sort({ [sortField]: sortDir }).toArray()
        return toys
    } catch (err) {
        logger.error('cannot find toys', err)
        throw err
    }
}

async function getById(toyId) {
    try {
        const col = await dbService.getCollection('toy')
        const toy = await col.findOne({ _id: ObjectId.createFromHexString(toyId) })
        if (!toy.createdAt && toy._id?.getTimestamp) toy.createdAt = toy._id.getTimestamp()
        return toy
    } catch (err) {
        logger.error('while finding toy ' + toyId, err)
        throw err
    }
}

async function add(toy) {
    try {
        const col = await dbService.getCollection('toy')
        const toSave = {
            name: toy.name,
            imgUrl: toy.imgUrl || '',
            price: Number(toy.price) || 0,
            labels: Array.isArray(toy.labels) ? toy.labels : [],
            inStock: Boolean(toy.inStock),
            createdAt: Date.now(),
            msgs: Array.isArray(toy.msgs) ? toy.msgs : []
        }
        const { insertedId } = await col.insertOne(toSave)
        toSave._id = insertedId
        return toSave
    } catch (err) {
        logger.error('cannot insert toy', err)
        throw err
    }
}

async function update(toy) {
    try {
        const col = await dbService.getCollection('toy')
        const _id = ObjectId.createFromHexString(toy._id)
        const toSave = {
            name: toy.name,
            imgUrl: toy.imgUrl || '',
            price: Number(toy.price) || 0,
            labels: Array.isArray(toy.labels) ? toy.labels : [],
            inStock: Boolean(toy.inStock)
        }
        await col.updateOne({ _id }, { $set: toSave })
        return { ...toy, _id }
    } catch (err) {
        logger.error('cannot update toy ' + toy._id, err)
        throw err
    }
}

async function remove(toyId) {
    try {
        const col = await dbService.getCollection('toy')
        const { deletedCount } = await col.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
        return deletedCount
    } catch (err) {
        logger.error('cannot remove toy ' + toyId, err)
        throw err
    }
}

async function addToyMsg(toyId, msg) {
    try {
        const col = await dbService.getCollection('toy')
        const toPush = {
            id: utilService.makeId(),
            txt: msg.txt,
            by: msg.by?._id || msg.by,          
            fullname: msg.by?.fullname || msg.fullname || '',
            createdAt: msg.createdAt || Date.now(),
        }
        await col.updateOne(
            { _id: ObjectId.createFromHexString(toyId) },
            { $push: { msgs: toPush } }
        )
        return toPush
    } catch (err) {
        logger.error('cannot add toy msg ' + toyId, err)
        throw err
    }
}

async function removeToyMsg(toyId, msgId) {
    try {
        const col = await dbService.getCollection('toy')
        await col.updateOne(
            { _id: ObjectId.createFromHexString(toyId) },
            { $pull: { msgs: { id: msgId } } }
        )
        return msgId
    } catch (err) {
        logger.error('cannot remove toy msg ' + toyId, err)
        throw err
    }
}
