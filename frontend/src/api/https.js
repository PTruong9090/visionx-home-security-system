const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function normalizeBaseUrl(url) {
    return url.replace(/\/+$/, '')
}

export async function request(path, options={}) {
    const normalizedURL = normalizeBaseUrl(API_BASE_URL) 
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    const res = await fetch(`${normalizedURL}/api/v1${normalizedPath}`, {
        ...options,
        headers: {
            'credentials': 'include',
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    })

    let data = null

    if (res.status !== 204) {
        data = await res.json().catch(() => null)
    }

    if (!res.ok) {
        throw new Error(data?.message || 'Request failed')
    }

    return data
}