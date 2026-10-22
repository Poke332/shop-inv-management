export function fail(status, message, extra = {}) {
  throw Object.assign(new Error(message), { status, ...extra })
}

export function text(value, name, { min = 1, max = 200 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    fail(400, `${name} must be a string between ${min} and ${max} characters.`)
  }
  return value.trim()
}

export function integer(value, name, { min = 0, max = 1000000000000 } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    fail(400, `${name} must be an integer between ${min} and ${max}.`)
  }
  return value
}

export function boolean(value, name) {
  if (typeof value !== 'boolean') fail(400, `${name} must be a boolean.`)
  return value
}

export function reviewId(value) {
  if (!/^R-\d+$/.test(value)) fail(404, 'Review not found.')
  return Number(value.slice(2))
}
