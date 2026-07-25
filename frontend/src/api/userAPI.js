import { request } from "./https";

export function getUser() {
    return request('users/me', {
        method: "GET"
    })
}