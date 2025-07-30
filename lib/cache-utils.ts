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