import { request } from "./https";

export function getCameras(options = {}) {
    return request('cameras', {
        method: 'GET',
        ...options
    })
}

export function getOneCamera(id, options = {}) {
    return request(`cameras/${id}`, {
        method: 'GET',
        ...options,
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
        method: 'PATCH',
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

export function getStreamURL(id, options = {}) {
    return request(`cameras/${id}/stream`, {
        method: 'GET',
        ...options
    })
}