export type error = Error | undefined

function newError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function fmtError(message: string, cause?: Error): Error {
  const causeMessages: string[] = []
  let nextCause = cause ?? undefined
  while (nextCause) {
    const causeMessage = `${nextCause.name === "Error" ? "" : `${nextCause.name}: `}${nextCause.message}`
    causeMessages.push(causeMessage)
    nextCause = nextCause.cause ? newError(nextCause.cause) : undefined
  }
  const fullCauseMessage = causeMessages.join(" -> ")
  const errorMessage = fullCauseMessage ? `${message} -> ${fullCauseMessage}` : message
  return new Error(errorMessage)
}

function attempt<T>(fn: () => Promise<T>): Promise<[T, Error | undefined]>
function attempt<T>(fn: () => T): [T, Error | undefined]
function attempt<T>(fn: () => Promise<T> | T) {
  try {
    const result = fn()
    if (result instanceof Promise) {
      return result
        .then((value) => [value, undefined] as [T, undefined])
        .catch((error: unknown) => [undefined as T, newError(error)])
    }
    return [result, undefined]
  } catch (error) {
    return [undefined as T, newError(error)]
  }
}

export { fmtError, attempt }