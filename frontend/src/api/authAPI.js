import { request } from "./https";


export function login(user) {
    return request('/auth/login', {
        method: 'POST',
        body: user,
    })
}


export function signup(user) {
    return request('/auth/signup', {
        method: "POST",
        body: user,
    })
}


export function logout() {
    return request('/auth/logout', {
        method: "POST",
    })
}