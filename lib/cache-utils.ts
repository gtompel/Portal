// Утилиты для работы с кэшем на клиентской стороне

// Функция для принудительного обновления данных
export async function refreshData(url: string): Promise<void> {
  try {
    // Добавляем timestamp для обхода кэша браузера
    const timestamp = Date.now()
    const separator = url.includes('?') ? '&' : '?'
    const urlWithTimestamp = `${url}${separator}_t=${timestamp}`
    
    await fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error refreshing data:', error)
  }
}

// Функция для очистки кэша на сервере
export async function clearServerCache(pattern: string): Promise<void> {
  try {
    await fetch('/api/cache/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pattern })
    })
  } catch (error) {
    console.error('Error clearing server cache:', error)
  }
} 

// Утилита для кэширования запросов
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export function getCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 60000 // 60 секунд по умолчанию
): Promise<T> {
  const cached = cache.get(key)
  const now = Date.now()

  // Если есть кэш и он не истек
  if (cached && (now - cached.timestamp) < cached.ttl) {
    return Promise.resolve(cached.data)
  }

  // Выполняем запрос и кэшируем результат
  return queryFn().then(data => {
    cache.set(key, {
      data,
      timestamp: now,
      ttl
    })
    return data
  })
}

export function clearCache(pattern?: string) {
  if (pattern) {
    // Удаляем записи по паттерну
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    // Очищаем весь кэш
    cache.clear()
  }
}

export function generateCacheKey(operation: string, params: any): string {
  return `${operation}:${JSON.stringify(params)}`
} 