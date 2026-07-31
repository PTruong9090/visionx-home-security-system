export function messageForError(err, overrides = {}) {
    if (err?.status === undefined) {
        return "Can't reach the server. Check your connection and try again."
    }

    if (overrides[err.status]) {
        return overrides[err.status]
    }

    if (err.status >= 500) {
        return "Something went wrong on our end. Please try again."
    }

    return err.message || "Request failed"
}