const STORAGE_PREFIX = 'gostman_'

export const KEYS = {
    REQUESTS: `${STORAGE_PREFIX}requests`,
    FOLDERS: `${STORAGE_PREFIX}folders`,
    HISTORY: `${STORAGE_PREFIX}history`,
    VARS: `${STORAGE_PREFIX}vars`
}

export function loadState(key, defaultValue) {
    try {
        const serialized = localStorage.getItem(key)
        if (serialized === null) return defaultValue
        return JSON.parse(serialized)
    } catch (err) {
        console.error(`Error loading state for ${key}`, err)
        return defaultValue
    }
}

export function saveState(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
        console.error(`Error saving state for ${key}`, err)
    }
}

export function resetState() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key))
    window.location.reload()
}
