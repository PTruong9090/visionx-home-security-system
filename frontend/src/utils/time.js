const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR


export function secondsSince(isoString, now = Date.now()) {
    if (!isoString) {
        return null
    }

    const parsed = new Date(isoString).getTime()

    if (Number.isNaN(parsed)) {
        return null
    }

    return Math.max(0, (now - parsed) / 1000)
}


function pluralize(value, unit) {
    return `${value} ${unit}${value === 1 ? "" : "s"} ago`
}


export function formatRelativeTime(isoString, now = Date.now()) {
    const age = secondsSince(isoString, now)

    if (age === null) {
        return null
    }

    if (age < 10) {
        return "just now"
    }

    if (age < MINUTE) {
        return pluralize(Math.floor(age), "second")
    }

    if (age < HOUR) {
        return pluralize(Math.floor(age / MINUTE), "minute")
    }

    if (age < DAY) {
        return pluralize(Math.floor(age / HOUR), "hour")
    }

    return pluralize(Math.floor(age / DAY), "day")
}


export function formatAbsoluteTime(isoString) {
    if (!isoString) {
        return null
    }

    const parsed = new Date(isoString)

    if (Number.isNaN(parsed.getTime())) {
        return null
    }

    return parsed.toLocaleString()
}
