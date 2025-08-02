import { useState, useCallback, useMemo, useRef } from "react"

// Оптимизированный useState с мемоизацией
export function useOptimizedState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue)
  const stateRef = useRef<T>(initialValue)

  const setOptimizedState = useCallback((newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === "function" 
      ? (newValue as (prev: T) => T)(stateRef.current)
      : newValue

    // Обновляем только если значение изменилось
    if (nextValue !== stateRef.current) {
      stateRef.current = nextValue
      setState(nextValue)
    }
  }, [])

  return [state, setOptimizedState] as const
}

// Хук для оптимизированного списка
export function useOptimizedList<T>(initialItems: T[] = []) {
  const [items, setItems] = useState<T[]>(initialItems)
  const itemsRef = useRef<T[]>(initialItems)

  const addItem = useCallback((item: T) => {
    setItems(prev => {
      const newItems = [...prev, item]
      itemsRef.current = newItems
      return newItems
    })
  }, [])

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setItems(prev => {
      const newItems = prev.filter(item => !predicate(item))
      itemsRef.current = newItems
      return newItems
    })
  }, [])

  const updateItem = useCallback((predicate: (item: T) => boolean, updater: (item: T) => T) => {
    setItems(prev => {
      const newItems = prev.map(item => predicate(item) ? updater(item) : item)
      itemsRef.current = newItems
      return newItems
    })
  }, [])

  const setItemsOptimized = useCallback((newItems: T[]) => {
    if (JSON.stringify(newItems) !== JSON.stringify(itemsRef.current)) {
      itemsRef.current = newItems
      setItems(newItems)
    }
  }, [])

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    setItems: setItemsOptimized
  }
}

// Хук для кэширования вычислений
export function useMemoizedValue<T>(value: T, deps: any[]): T {
  return useMemo(() => value, deps)
}

// Хук для оптимизированного фильтра
export function useOptimizedFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  deps: any[] = []
) {
  return useMemo(() => items.filter(filterFn), [items, ...deps])
}

// Хук для оптимизированной сортировки
export function useOptimizedSort<T>(
  items: T[],
  sortFn: (a: T, b: T) => number,
  deps: any[] = []
) {
  return useMemo(() => [...items].sort(sortFn), [items, ...deps])
} 