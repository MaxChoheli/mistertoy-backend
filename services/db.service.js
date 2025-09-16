import { MongoClient } from 'mongodb'
import { logger } from './logger.service.js'
import { config } from '../config/index.js'

let client
let db

export const dbService = { getCollection }

async function connect() {
	if (db) return db
	const uri = config.dbURL || process.env.MONGO_URL
	const dbName = config.dbName || process.env.DB_NAME
	if (!uri) throw new Error('Missing Mongo URL (config.dbURL / MONGO_URL)')
	try {
		client = new MongoClient(uri)
		await client.connect()
		db = dbName ? client.db(dbName) : client.db()
		logger.info('Connected to MongoDB')
		return db
	} catch (err) {
		logger.error('Cannot connect to DB', err)
		throw err
	}
}

async function getCollection(name) {
	const database = await connect()
	return database.collection(name)
}
