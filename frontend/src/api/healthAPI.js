import { request } from "./https";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function checkHealth() {
    const res = await fetch(`${API_BASE_URL}/health`, {
        method: "GET"
    })

    return res
}