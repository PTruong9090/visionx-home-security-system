import { request } from "./https";

export function getUser() {
    return request('me', {
        method: "GET"
    })
}