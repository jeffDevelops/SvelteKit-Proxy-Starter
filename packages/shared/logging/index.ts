export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogFields {
  [key: string]: unknown
}

// Vendor-agnostic logging seam (same pattern as EmailProvider): application
// code depends on this interface only, so a hosted sink later means one new
// adapter, not a codebase sweep.
export interface Logger {
  debug(message: string, fields?: LogFields): void
  info(message: string, fields?: LogFields): void
  warn(message: string, fields?: LogFields): void
  error(message: string, fields?: LogFields): void
  /** New logger that stamps `fields` onto every line (e.g. a request id). */
  child(fields: LogFields): Logger
}

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

// Redaction is by key name: values under matching keys never reach a log
// line regardless of level ("secrets are never logged, even at debug").
const SECRET_KEY_PATTERN = /password|secret|token|key|cookie|authorization|credential/i
const MAX_DEPTH = 8

export function redactSecrets(fields: LogFields): LogFields {
  return redactValue(fields, 0, new WeakSet()) as LogFields
}

function redactValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') return value
  if (depth >= MAX_DEPTH || seen.has(value)) return '[truncated]'
  seen.add(value)

  if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1, seen))
  if (value instanceof Date || value instanceof Error) return String(value)

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SECRET_KEY_PATTERN.test(key) ? '[redacted]' : redactValue(entry, depth + 1, seen),
    ]),
  )
}

export interface ConsoleLoggerOptions {
  /** Minimum level written; defaults to 'info'. */
  level?: LogLevel
  /** Fields stamped onto every line. */
  base?: LogFields
  /** Line sink — injectable for tests; defaults to stdout. */
  write?: (line: string) => void
}

// JSON lines to stdout: greppable in dev, ingestible by any log shipper in
// prod without a format change.
export function createConsoleLogger(options: ConsoleLoggerOptions = {}): Logger {
  const threshold = LEVEL_RANK[options.level ?? 'info']
  // oxlint-disable-next-line no-console -- this is the console adapter
  const write = options.write ?? ((line: string) => console.log(line))
  const base = options.base ?? {}

  const emit = (level: LogLevel, message: string, fields?: LogFields) => {
    if (LEVEL_RANK[level] < threshold) return
    write(
      JSON.stringify({
        level,
        time: new Date().toISOString(),
        message,
        ...redactSecrets({ ...base, ...fields }),
      }),
    )
  }

  return {
    debug: (message, fields) => emit('debug', message, fields),
    info: (message, fields) => emit('info', message, fields),
    warn: (message, fields) => emit('warn', message, fields),
    error: (message, fields) => emit('error', message, fields),
    child: (fields) =>
      createConsoleLogger({ ...options, base: { ...base, ...fields }, write: options.write }),
  }
}
