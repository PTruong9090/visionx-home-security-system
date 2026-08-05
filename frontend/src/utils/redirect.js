export const DEFAULT_REDIRECT = '/dashboard'


function isInternalPath(path) {
    if (typeof path !== 'string' || !path.startsWith('/') || path[1] === '/' || path[1] === '\\') {
        return false
    }

    return true
}


function toUrlPart(value, prefix) {
    if (typeof value !== 'string' || (value !== '' && !value.startsWith(prefix))) {
        return ''
    }

    return value
}


export function resolveRedirect(from) {
    if (typeof from === 'string') {
        return isInternalPath(from) ? from : DEFAULT_REDIRECT
    }

    if (typeof from !== 'object' || from === null || !isInternalPath(from.pathname)) {
        return DEFAULT_REDIRECT
    }

    return {
        pathname: from.pathname,
        search: toUrlPart(from.search, '?'),
        hash: toUrlPart(from.hash, '#'),
    }
}
