import { ObjectId } from 'mongodb'
import { dbService } from '../../services/db.service.js'

export const reviewService = { query, add, remove }

function _buildMatch(filterBy = {}) {
    const match = {}
    if (filterBy.toyId) match.toyId = ObjectId.createFromHexString(filterBy.toyId)
    if (filterBy.userId) match.userId = ObjectId.createFromHexString(filterBy.userId)
    if (filterBy.txt) match.txt = { $regex: filterBy.txt, $options: 'i' }
    return match
}

async function query(filterBy = {}) {
    const col = await dbService.getCollection('review')
    const pipeline = [
        { $match: _buildMatch(filterBy) },
        { $lookup: { from: 'user', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $lookup: { from: 'toy', localField: 'toyId', foreignField: '_id', as: 'toy' } },
        { $unwind: '$toy' },
        {
            $project: {
                txt: 1,
                createdAt: 1,
                'user._id': 1, 'user.fullname': 1,
                'toy._id': 1, 'toy.name': 1, 'toy.price': 1
            }
        }
    ]
    return await col.aggregate(pipeline).toArray()
}

async function add({ txt, toyId, userId }) {
    const col = await dbService.getCollection('review')
    const doc = {
        txt,
        toyId: ObjectId.createFromHexString(toyId),
        userId: ObjectId.createFromHexString(userId),
        createdAt: Date.now(),
    }
    const { insertedId } = await col.insertOne(doc)
    doc._id = insertedId
    return doc
}

async function remove(reviewId, requester) {
    const col = await dbService.getCollection('review')
    const _id = ObjectId.createFromHexString(reviewId)
    const review = await col.findOne({ _id })
    if (!review) return 0
    const isOwner = requester?._id === review.userId.toString()
    const isAdmin = !!requester?.isAdmin
    if (!isOwner && !isAdmin) throw new Error('Not allowed')
    const { deletedCount } = await col.deleteOne({ _id })
    return deletedCount
}
