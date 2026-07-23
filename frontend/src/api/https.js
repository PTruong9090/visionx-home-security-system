const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function normalizeBaseUrl(url) {
    return url.replace(/\/+$/, '')
}

export async function request(path, options={}) {
    const normalizedURL = normalizeBaseUrl(API_BASE_URL) 
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    if (options.body && !(typeof options.body === 'string')) {
        options.body = JSON.stringify(options.body)
    }

    const res = await fetch(`${normalizedURL}/api/v1${normalizedPath}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    })

    let data = null

    if (res.status !== 204) {
        data = await res.json().catch(() => null)
    }

    if (!res.ok) {
        const detail = data?.detail

        const message = Array.isArray(detail) ? detail.map((error) => error.msg).join(', ') : detail

        throw new Error(message || 'Request failed')
    }

    return data
}