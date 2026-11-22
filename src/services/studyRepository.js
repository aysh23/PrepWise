const STORAGE_VERSION = 2
const PREFIX = 'prepwise_'

export const studyRepository = {
  load(key, fallback) {
    try {
      if (localStorage.getItem(`${PREFIX}storage_version`) !== String(STORAGE_VERSION)) {
        return fallback
      }
      const stored = localStorage.getItem(`${PREFIX}${key}`)
      return stored ? JSON.parse(stored) : fallback
    } catch {
      return fallback
    }
  },

  save(key, value) {
    try {
      localStorage.setItem(`${PREFIX}storage_version`, String(STORAGE_VERSION))
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
    } catch {
      // The prototype remains usable if storage is unavailable.
    }
  },
}
