import { MongoClient } from 'mongodb'
import { logger } from './logger.service.js'

let client
let db

export const dbService = {
	getCollection,
}

async function connect() {
	if (db) return db
	const uri = process.env.MONGO_URL
	if (!uri) throw new Error('Missing MONGO_URL')
	try {
		client = new MongoClient(uri)
		await client.connect()
		db = client.db()
		logger.info('Connected to MongoDB')
		return db
	} catch (err) {
		logger.error('Cannot connect to DB', err)
		throw err
	}
}

async function getCollection(collectionName) {
	try {
		const database = await connect()
		return database.collection(collectionName)
	} catch (err) {
		logger.error('Failed to get Mongo collection', err)
		throw err
	}
}
