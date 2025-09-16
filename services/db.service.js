import { MongoClient } from 'mongodb'
import { logger } from './logger.service.js'
import config from '../config/index.js'

let client
let db

export const dbService = {
	getCollection,
}

async function connect() {
	if (db) return db
	if (!config.dbURL) throw new Error('Missing config.dbURL (MONGO_URL)')
	try {
		client = new MongoClient(config.dbURL)
		await client.connect()
		db = config.dbName ? client.db(config.dbName) : client.db()
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
