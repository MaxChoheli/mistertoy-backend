import { reviewService } from './review.service.js'

export async function getReviews(req, res) {
    try {
        const reviews = await reviewService.query(req.query)
        res.send(reviews)
    } catch (err) {
        res.status(500).send({ err: 'Failed to get reviews' })
    }
}

export async function addReview(req, res) {
    try {
        const user = req.loggedinUser
        const review = await reviewService.add({ ...req.body, userId: user._id })
        res.send(review)
    } catch (err) {
        res.status(500).send({ err: 'Failed to add review' })
    }
}

export async function removeReview(req, res) {
    try {
        const deleted = await reviewService.remove(req.params.id, req.loggedinUser)
        if (!deleted) return res.status(404).send({ err: 'Not found' })
        res.send({ msg: 'Removed' })
    } catch (err) {
        const code = err.message === 'Not allowed' ? 403 : 500
        res.status(code).send({ err: err.message })
    }
}
