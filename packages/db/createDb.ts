import postgres from 'postgres'
import * as schema from './schema/index'
import { drizzle } from 'drizzle-orm/postgres-js'

export const createDb = (databaseUrl: string) => {
  const client = postgres(databaseUrl)
  return drizzle(client, { schema })
}
