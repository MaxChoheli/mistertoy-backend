import { ObjectId } from 'mongodb'
import { dbService } from '../../services/db.service.js'

export const reviewService = { query, add, remove }

function toObjectId(id) {
    try {
        return ObjectId.createFromHexString(id)
    } catch {
        throw new Error('Bad id')
    }
}

function _buildMatch(filterBy = {}) {
    const match = {}
    if (filterBy.toyId) match.toyId = toObjectId(filterBy.toyId)
    if (filterBy.userId) match.userId = toObjectId(filterBy.userId)
    if (filterBy.txt) match.txt = { $regex: String(filterBy.txt), $options: 'i' }
    return match
}

async function query(filterBy = {}) {
    const col = await dbService.getCollection('review')
    const match = _buildMatch(filterBy)
    const pipeline = [
        { $match: match },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: 'user',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: '$user' },
        {
            $lookup: {
                from: 'toy',
                localField: 'toyId',
                foreignField: '_id',
                as: 'toy'
            }
        },
        { $unwind: '$toy' },
        {
            $project: {
                txt: 1,
                createdAt: 1,
                'user._id': 1,
                'user.fullname': 1,
                'toy._id': 1,
                'toy.name': 1,
                'toy.price': 1
            }
        }
    ]
    return await col.aggregate(pipeline).toArray()
}

async function add({ txt, toyId, userId }) {
    const col = await dbService.getCollection('review')
    const doc = {
        txt: String(txt || ''),
        toyId: toObjectId(toyId),
        userId: toObjectId(userId),
        createdAt: Date.now()
    }
    const { insertedId } = await col.insertOne(doc)
    doc._id = insertedId
    return doc
}

async function remove(reviewId, requester) {
    const col = await dbService.getCollection('review')
    const _id = toObjectId(reviewId)
    const review = await col.findOne({ _id })
    if (!review) return 0
    const isOwner = requester && requester._id === String(review.userId)
    const isAdmin = requester && !!requester.isAdmin
    if (!isOwner && !isAdmin) throw new Error('Not allowed')
    const { deletedCount } = await col.deleteOne({ _id })
    return deletedCount
}
