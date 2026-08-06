import { ApiError } from "./ApiError"


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function normalizeBaseUrl(url) {
    return url.replace(/\/+$/, '')
}

let unAuthorizedHandler = null

export function setOnUnAuthorized(handler) {
    unAuthorizedHandler = handler
}

export async function request(path, options={}) {
    const normalizedURL = normalizeBaseUrl(API_BASE_URL) 
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    const { body, headers, skipAuthHandler, ...rest } = options

    const init = {
        ...rest,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    }

    const res = await fetch(`${normalizedURL}/api/v1${normalizedPath}`, init)

    let data = null

    if (res.status !== 204) {
        data = await res.json().catch(() => null)
    }

    if (!res.ok) {

        if (res.status === 401 && !skipAuthHandler && unAuthorizedHandler) {
            unAuthorizedHandler()
        }

        const detail = data?.detail

        const message = Array.isArray(detail) ? detail.map((error) => error.msg).join(', ') : detail

        throw new ApiError(message || 'Request failed', res.status)
    }

    return data
}