import process from 'node:process'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * 获取环境变量
 * 优先从 process.env 读取（Node.js 运行时），回退到 import.meta.env（Vite 构建时注入）
 * @param key - 环境变量名
 * @returns 环境变量值
 */
const getEnv = (key: string) => process.env[key] ?? import.meta.env[key]

// PostgreSQL 连接字符串：postgres://user:password@host:port/dbname
const connectionString = `postgres://${getEnv('DATABASE_USER')}:${getEnv('DATABASE_PASSWORD')}@${getEnv('DATABASE_HOST')}:${getEnv('DATABASE_PORT')}/${getEnv('DATABASE_DB')}`

// 创建 postgres 客户端实例
const client = postgres(connectionString)

/**
 * Drizzle ORM 实例（绑定 schema 以支持类型安全的查询）
 * 用于执行数据库操作，如查询、插入、更新等
 */
export const db = drizzle(client, { schema })
