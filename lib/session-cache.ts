interface CachedSession {
  data: any
  timestamp: number
  ttl: number
}

class SessionCache {
  private cache = new Map<string, CachedSession>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 минут

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Очистка устаревших записей
  cleanup(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const sessionCache = new SessionCache()

// Автоматическая очистка каждые 10 минут
setInterval(() => {
  sessionCache.cleanup()
}, 10 * 60 * 1000) 