import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = `postgres://${import.meta.env.DATABASE_USER}:${import.meta.env.DATABASE_PASSWORD}@${import.meta.env.DATABASE_HOST}:${import.meta.env.DATABASE_PORT}/${import.meta.env.DATABASE_DB}`

const client = postgres(connectionString)

export const db = drizzle(client, { schema })
