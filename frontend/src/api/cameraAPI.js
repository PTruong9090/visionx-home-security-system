import { request } from "./https";

export function getCameras() {
    return request('cameras', {
        method: 'GET',
    })
}

export function getOneCamera(id) {
    return request(`cameras/${id}`, {
        method: 'GET'
    })
}

export function createCamera(camera)  {
    return request('cameras', {
        method: 'POST',
        body: JSON.stringify(camera)
    })
}

export function updateCamera(id, camera) {
    return request(`cameras/${id}`, {
        method: 'PUT',
        body: JSON.stringify(camera)
    })
}

export function deleteCamera(id) {
    return request(`cameras/${id}`, {
        method: 'DELETE',
    })
}

export function testCamera(id) {
    return request(`cameras/${id}/test`, {
        method: 'POST',
    })
}

export function getStreamURL(id) {
    return request(`cameras/${id}/stream`, {
        method: 'GET'
    })
}