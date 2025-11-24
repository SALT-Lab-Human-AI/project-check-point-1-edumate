# Memory Tracking Documentation

This document describes the memory tracking system implemented for monitoring memory usage across different features of the EduMate application.

## Overview

The memory tracking system monitors memory usage for:
- **Backend**: All API endpoints and features
- **Frontend**: All pages, components, and API calls

Memory metrics are collected automatically and can be retrieved via API endpoints or console logs.

## Backend Memory Tracking

### Setup

The backend uses `psutil` to track process memory usage. The tracking is implemented via decorators that automatically measure memory before and after function execution.

### Usage

All API endpoints are automatically tracked. The decorator `@track_memory_feature` is applied to each endpoint:

```python
from backend.memory_tracker import track_memory_feature

@app.post("/ask")
@track_memory_feature("tutor/ask")
async def ask_question(payload: AskPayload):
    # Function implementation
    pass
```

### Tracked Features

The following backend features are tracked:

- `tutor/ask` - AI tutor question answering
- `quiz/generate` - Quiz generation
- `quiz/grade` - Quiz grading
- `quiz/track` - Quiz attempt tracking
- `auth/signup` - User signup
- `auth/login` - User login
- `auth/link-account` - Account linking
- `auth/get-students` - Get linked students
- `time/track` - Time tracking
- `stats/student` - Student statistics
- `goals/get` - Get daily goals
- `goals/set` - Set daily goals
- `goals/parent-set` - Parent setting goals
- `goals/completion` - Goal completion data
- `students/update-grade` - Update student grade

### API Endpoints

#### Get Memory Metrics

```http
GET /memory/metrics?feature=<feature_name>&limit=100
```

Returns memory metrics for a specific feature or all features.

**Query Parameters:**
- `feature` (optional): Feature name to filter by
- `limit` (optional, default: 100): Maximum number of metrics to return per feature

**Response:**
```json
{
  "success": true,
  "metrics": {
    "tutor/ask": {
      "metrics": [
        {
          "feature": "tutor/ask",
          "timestamp": "2025-01-27T10:30:00",
          "memory_before_mb": 150.5,
          "memory_after_mb": 152.3,
          "memory_delta_mb": 1.8,
          "memory_before_percent": 2.5,
          "memory_after_percent": 2.6,
          "system_memory_percent": 45.2,
          "execution_time_seconds": 1.234,
          "status": "success"
        }
      ],
      "count": 1,
      "latest": { ... }
    }
  }
}
```

#### Get Memory Summary

```http
GET /memory/summary
```

Returns aggregated memory usage summary across all features.

**Response:**
```json
{
  "success": true,
  "summary": {
    "current_memory": {
      "process_memory_mb": 152.3,
      "process_memory_percent": 2.6,
      "system_memory_total_mb": 16384.0,
      "system_memory_available_mb": 8192.0,
      "system_memory_percent": 45.2
    },
    "features": {
      "tutor/ask": {
        "total_calls": 100,
        "avg_memory_delta_mb": 1.5,
        "max_memory_delta_mb": 5.2,
        "min_memory_delta_mb": 0.1,
        "avg_execution_time_seconds": 1.234,
        "max_execution_time_seconds": 3.456,
        "error_count": 2,
        "latest_metric": { ... }
      }
    }
  }
}
```

#### Clear Memory Metrics

```http
POST /memory/clear?feature=<feature_name>
```

Clears memory metrics for a specific feature or all features.

**Query Parameters:**
- `feature` (optional): Feature name to clear. If omitted, clears all metrics.

**Response:**
```json
{
  "success": true,
  "message": "Cleared metrics for tutor/ask"
}
```

## Frontend Memory Tracking

### Setup

The frontend uses the Performance API (if available) to track JavaScript heap memory usage. Memory tracking is implemented via React hooks and utility functions.

### Usage

#### React Hook for Pages

Add the `useMemoryTracking` hook to any page component:

```typescript
import { useMemoryTracking } from "@/lib/memory-tracker"

export default function MyPage() {
  useMemoryTracking('my-page')
  // Component implementation
}
```

#### Track API Calls

Wrap API calls with `trackMemoryFeature`:

```typescript
import { trackMemoryFeature } from "@/lib/memory-tracker"

const result = await trackMemoryFeature('api/my-call', async () => {
  return await myApiCall()
})
```

### Tracked Features

The following frontend features are tracked:

- `student/dashboard` - Student dashboard page
- `student/s1` - S1 module page
- `student/s2` - S2 module page
- `student/s3` - S3 module page
- `parent/dashboard` - Parent dashboard page
- `auth/login-page` - Login page
- `auth/signup-page` - Signup page
- `api/ask` - Tutor API call
- `api/quiz-generate` - Quiz generation API call
- `api/quiz-grade` - Quiz grading API call

### Utility Functions

#### Get Memory Metrics

```typescript
import { getMemoryMetrics } from "@/lib/memory-tracker"

// Get all metrics
const allMetrics = getMemoryMetrics()

// Get metrics for a specific feature
const featureMetrics = getMemoryMetrics('student/dashboard', 100)
```

#### Get Memory Summary

```typescript
import { getMemorySummary } from "@/lib/memory-tracker"

const summary = getMemorySummary()
console.log(summary.current) // Current memory usage
console.log(summary.features) // Aggregated stats per feature
```

#### Log Memory Metrics

```typescript
import { logMemoryMetrics } from "@/lib/memory-tracker"

// Log all metrics
logMemoryMetrics()

// Log metrics for a specific feature
logMemoryMetrics('student/dashboard')
```

#### Clear Memory Metrics

```typescript
import { clearMemoryMetrics } from "@/lib/memory-tracker"

// Clear all metrics
clearMemoryMetrics()

// Clear metrics for a specific feature
clearMemoryMetrics('student/dashboard')
```

## Memory Metrics Explained

### Backend Metrics

- **memory_before_mb**: Process memory usage before function execution (MB)
- **memory_after_mb**: Process memory usage after function execution (MB)
- **memory_delta_mb**: Change in memory usage (MB)
- **memory_before_percent**: Process memory as percentage of system memory (before)
- **memory_after_percent**: Process memory as percentage of system memory (after)
- **system_memory_percent**: Overall system memory usage percentage
- **execution_time_seconds**: Function execution time (seconds)
- **status**: "success" or "error"

### Frontend Metrics

- **memory_before_mb**: JavaScript heap memory usage before operation (MB)
- **memory_after_mb**: JavaScript heap memory usage after operation (MB)
- **memory_delta_mb**: Change in memory usage (MB)
- **execution_time_ms**: Operation execution time (milliseconds)
- **status**: "success" or "error"

## Best Practices

1. **Monitor Regularly**: Check memory metrics periodically to identify memory leaks or high usage patterns.

2. **Set Limits**: The system automatically limits stored metrics to 1000 per feature to prevent memory bloat.

3. **Clear Old Metrics**: Periodically clear old metrics if you don't need historical data.

4. **Track Key Operations**: Focus tracking on memory-intensive operations or features that might have memory leaks.

5. **Compare Metrics**: Compare memory deltas across similar operations to identify anomalies.

## Troubleshooting

### Backend: psutil not found

If you see an error about `psutil` not being found:

```bash
pip install psutil
```

### Frontend: Memory API not available

The Performance Memory API is only available in Chrome/Edge. In other browsers, memory tracking will gracefully fail and return `null` for memory values.

### High Memory Usage

If you notice high memory usage:

1. Check the memory summary to identify which features use the most memory
2. Look for features with consistently high memory deltas
3. Check for memory leaks by monitoring memory growth over time
4. Review the latest metrics for each feature to identify problematic operations

## Example Usage

### Backend: Check Memory Usage

```python
from backend.memory_tracker import get_memory_summary

summary = get_memory_summary()
print(f"Current memory: {summary['current_memory']['process_memory_mb']} MB")
print(f"Features tracked: {len(summary['features'])}")
```

### Frontend: Monitor Memory in Console

```typescript
import { logMemoryMetrics } from "@/lib/memory-tracker"

// Log all metrics to console
logMemoryMetrics()
```

### Backend: Get Metrics via API

```bash
# Get all metrics
curl http://localhost:8000/memory/metrics

# Get metrics for a specific feature
curl http://localhost:8000/memory/metrics?feature=tutor/ask

# Get summary
curl http://localhost:8000/memory/summary
```

## Notes

- Memory metrics are stored in-memory and will be lost on server restart
- For persistent storage, consider extending the system to store metrics in a database
- Memory tracking adds minimal overhead (~1-2ms per tracked operation)
- The system is thread-safe on the backend

