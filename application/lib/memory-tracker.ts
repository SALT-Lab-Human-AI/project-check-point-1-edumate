// memory-tracker.ts
/**
 * Frontend memory tracking utility using Performance API and Memory API
 */
import { useEffect } from 'react'

interface MemoryInfo {
  jsHeapSizeLimit?: number
  totalJSHeapSize?: number
  usedJSHeapSize?: number
}

interface MemoryMetric {
  feature: string
  timestamp: string
  memory_before_mb: number
  memory_after_mb: number
  memory_delta_mb: number
  execution_time_ms: number
  status: 'success' | 'error'
  error?: string
}

// In-memory storage for metrics (can be extended to send to backend)
const memoryMetrics: Map<string, MemoryMetric[]> = new Map()
const MAX_METRICS_PER_FEATURE = 1000

/**
 * Get current memory usage from Performance API
 */
function getMemoryUsage(): { usedMB: number; totalMB: number; limitMB: number } | null {
  // Check if Performance API with memory is available
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory as MemoryInfo
    if (memory.usedJSHeapSize && memory.totalJSHeapSize && memory.jsHeapSizeLimit) {
      return {
        usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024) * 100) / 100,
        totalMB: Math.round(memory.totalJSHeapSize / (1024 * 1024) * 100) / 100,
        limitMB: Math.round(memory.jsHeapSizeLimit / (1024 * 1024) * 100) / 100,
      }
    }
  }
  return null
}

/**
 * Track memory usage for a feature/function
 */
export async function trackMemoryFeature<T>(
  featureName: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const memoryBefore = getMemoryUsage()
  const startTime = performance.now()

  try {
    const result = await fn()
    const memoryAfter = getMemoryUsage()
    const endTime = performance.now()

    if (memoryBefore && memoryAfter) {
      const memoryDelta = memoryAfter.usedMB - memoryBefore.usedMB
      const executionTime = endTime - startTime

      const metric: MemoryMetric = {
        feature: featureName,
        timestamp: new Date().toISOString(),
        memory_before_mb: memoryBefore.usedMB,
        memory_after_mb: memoryAfter.usedMB,
        memory_delta_mb: Math.round(memoryDelta * 100) / 100,
        execution_time_ms: Math.round(executionTime * 100) / 100,
        status: 'success',
      }

      recordMetric(featureName, metric)
    }

    return result
  } catch (error) {
    const memoryAfter = getMemoryUsage()
    const endTime = performance.now()

    if (memoryBefore && memoryAfter) {
      const memoryDelta = memoryAfter.usedMB - memoryBefore.usedMB
      const executionTime = endTime - startTime

      const metric: MemoryMetric = {
        feature: featureName,
        timestamp: new Date().toISOString(),
        memory_before_mb: memoryBefore.usedMB,
        memory_after_mb: memoryAfter.usedMB,
        memory_delta_mb: Math.round(memoryDelta * 100) / 100,
        execution_time_ms: Math.round(executionTime * 100) / 100,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      }

      recordMetric(featureName, metric)
    }

    throw error
  }
}

/**
 * Record a memory metric
 */
function recordMetric(featureName: string, metric: MemoryMetric): void {
  if (!memoryMetrics.has(featureName)) {
    memoryMetrics.set(featureName, [])
  }

  const metrics = memoryMetrics.get(featureName)!
  metrics.push(metric)

  // Keep only last N metrics to prevent memory bloat
  if (metrics.length > MAX_METRICS_PER_FEATURE) {
    metrics.shift()
  }
}

/**
 * Get memory metrics for a specific feature or all features
 */
export function getMemoryMetrics(featureName?: string, limit: number = 100): Record<string, any> {
  if (featureName) {
    const metrics = memoryMetrics.get(featureName) || []
    const recentMetrics = metrics.slice(-limit)
    return {
      [featureName]: {
        metrics: recentMetrics,
        count: recentMetrics.length,
        latest: recentMetrics[recentMetrics.length - 1] || null,
      },
    }
  } else {
    const result: Record<string, any> = {}
    memoryMetrics.forEach((metrics, feature) => {
      const recentMetrics = metrics.slice(-limit)
      result[feature] = {
        metrics: recentMetrics,
        count: recentMetrics.length,
        latest: recentMetrics[recentMetrics.length - 1] || null,
      }
    })
    return result
  }
}

/**
 * Get memory usage summary
 */
export function getMemorySummary(): {
  current: ReturnType<typeof getMemoryUsage>
  features: Record<string, any>
} {
  const current = getMemoryUsage()
  const allMetrics = getMemoryMetrics()

  const summary: Record<string, any> = {}

  Object.keys(allMetrics).forEach((featureName) => {
    const featureData = allMetrics[featureName]
    const metrics = featureData.metrics || []

    if (metrics.length === 0) return

    const memoryDeltas = metrics.map((m: MemoryMetric) => m.memory_delta_mb)
    const executionTimes = metrics.map((m: MemoryMetric) => m.execution_time_ms)

    summary[featureName] = {
      total_calls: metrics.length,
      avg_memory_delta_mb:
        Math.round((memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length) * 100) / 100,
      max_memory_delta_mb: Math.round(Math.max(...memoryDeltas) * 100) / 100,
      min_memory_delta_mb: Math.round(Math.min(...memoryDeltas) * 100) / 100,
      avg_execution_time_ms:
        Math.round((executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length) * 100) /
        100,
      max_execution_time_ms: Math.round(Math.max(...executionTimes) * 100) / 100,
      error_count: metrics.filter((m: MemoryMetric) => m.status === 'error').length,
      latest_metric: featureData.latest,
    }
  })

  return {
    current,
    features: summary,
  }
}

/**
 * Clear memory metrics for a feature or all features
 */
export function clearMemoryMetrics(featureName?: string): void {
  if (featureName) {
    memoryMetrics.delete(featureName)
  } else {
    memoryMetrics.clear()
  }
}

/**
 * React hook to track memory usage for a page/component
 */
export function useMemoryTracking(featureName: string) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const memoryBefore = getMemoryUsage()
    const mountTime = performance.now()

    // Track on mount
    if (memoryBefore) {
      const metric: MemoryMetric = {
        feature: `${featureName}/mount`,
        timestamp: new Date().toISOString(),
        memory_before_mb: memoryBefore.usedMB,
        memory_after_mb: memoryBefore.usedMB,
        memory_delta_mb: 0,
        execution_time_ms: 0,
        status: 'success',
      }
      recordMetric(`${featureName}/mount`, metric)
    }

    // Track on unmount
    return () => {
      const memoryAfter = getMemoryUsage()
      const unmountTime = performance.now()

      if (memoryBefore && memoryAfter) {
        const memoryDelta = memoryAfter.usedMB - memoryBefore.usedMB
        const executionTime = unmountTime - mountTime

        const metric: MemoryMetric = {
          feature: `${featureName}/unmount`,
          timestamp: new Date().toISOString(),
          memory_before_mb: memoryBefore.usedMB,
          memory_after_mb: memoryAfter.usedMB,
          memory_delta_mb: Math.round(memoryDelta * 100) / 100,
          execution_time_ms: Math.round(executionTime * 100) / 100,
          status: 'success',
        }

        recordMetric(`${featureName}/unmount`, metric)
      }
    }
  }, [featureName])
}

/**
 * Log memory metrics to console (useful for debugging)
 */
export function logMemoryMetrics(featureName?: string): void {
  if (featureName) {
    const metrics = getMemoryMetrics(featureName)
    console.log(`[Memory Tracker] Metrics for ${featureName}:`, metrics)
  } else {
    const summary = getMemorySummary()
    console.log('[Memory Tracker] Summary:', summary)
  }
}

