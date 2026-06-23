import process from 'node:process'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const getEnv = (key: string) => process.env[key] ?? import.meta.env[key]

const connectionString = `postgres://${getEnv('DATABASE_USER')}:${getEnv('DATABASE_PASSWORD')}@${getEnv('DATABASE_HOST')}:${getEnv('DATABASE_PORT')}/${getEnv('DATABASE_DB')}`

const client = postgres(connectionString)

export const db = drizzle(client, { schema })
