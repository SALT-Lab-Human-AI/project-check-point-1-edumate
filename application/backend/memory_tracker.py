# memory_tracker.py
"""
Memory tracking utility for monitoring memory usage per feature/endpoint.
"""
import psutil
import os
import time
from typing import Dict, Optional, Any
from datetime import datetime
from functools import wraps
import threading

# In-memory storage for memory metrics (can be extended to use database)
_memory_metrics: Dict[str, list] = {}
_metrics_lock = threading.Lock()


def get_memory_usage() -> Dict[str, Any]:
    """
    Get current memory usage statistics.
    
    Returns:
        Dictionary with memory usage information:
        - process_memory_mb: Current process memory in MB
        - process_memory_percent: Current process memory as percentage of system memory
        - system_memory_total_mb: Total system memory in MB
        - system_memory_available_mb: Available system memory in MB
        - system_memory_percent: System memory usage percentage
    """
    process = psutil.Process(os.getpid())
    process_memory = process.memory_info()
    system_memory = psutil.virtual_memory()
    
    return {
        "process_memory_mb": round(process_memory.rss / (1024 * 1024), 2),
        "process_memory_percent": round(process.memory_percent(), 2),
        "system_memory_total_mb": round(system_memory.total / (1024 * 1024), 2),
        "system_memory_available_mb": round(system_memory.available / (1024 * 1024), 2),
        "system_memory_percent": round(system_memory.percent, 2),
    }


def track_memory_feature(feature_name: str):
    """
    Decorator to track memory usage for a specific feature/endpoint.
    
    Args:
        feature_name: Name of the feature being tracked (e.g., 'auth/login', 'quiz/generate')
    
    Usage:
        @track_memory_feature('auth/login')
        async def login(payload: LoginPayload):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Get memory before
            memory_before = get_memory_usage()
            start_time = time.time()
            
            try:
                # Execute the function
                result = await func(*args, **kwargs)
                
                # Get memory after
                memory_after = get_memory_usage()
                end_time = time.time()
                
                # Calculate memory delta
                memory_delta = memory_after["process_memory_mb"] - memory_before["process_memory_mb"]
                
                # Record metrics
                metric = {
                    "feature": feature_name,
                    "timestamp": datetime.now().isoformat(),
                    "memory_before_mb": memory_before["process_memory_mb"],
                    "memory_after_mb": memory_after["process_memory_mb"],
                    "memory_delta_mb": round(memory_delta, 2),
                    "memory_before_percent": memory_before["process_memory_percent"],
                    "memory_after_percent": memory_after["process_memory_percent"],
                    "system_memory_percent": memory_after["system_memory_percent"],
                    "execution_time_seconds": round(end_time - start_time, 3),
                    "status": "success"
                }
                
                _record_metric(feature_name, metric)
                
                return result
                
            except Exception as e:
                # Record error metrics
                memory_after = get_memory_usage()
                end_time = time.time()
                
                metric = {
                    "feature": feature_name,
                    "timestamp": datetime.now().isoformat(),
                    "memory_before_mb": memory_before["process_memory_mb"],
                    "memory_after_mb": memory_after["process_memory_percent"],
                    "memory_delta_mb": round(memory_after["process_memory_mb"] - memory_before["process_memory_mb"], 2),
                    "execution_time_seconds": round(end_time - start_time, 3),
                    "status": "error",
                    "error": str(e)
                }
                
                _record_metric(feature_name, metric)
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Get memory before
            memory_before = get_memory_usage()
            start_time = time.time()
            
            try:
                # Execute the function
                result = func(*args, **kwargs)
                
                # Get memory after
                memory_after = get_memory_usage()
                end_time = time.time()
                
                # Calculate memory delta
                memory_delta = memory_after["process_memory_mb"] - memory_before["process_memory_mb"]
                
                # Record metrics
                metric = {
                    "feature": feature_name,
                    "timestamp": datetime.now().isoformat(),
                    "memory_before_mb": memory_before["process_memory_mb"],
                    "memory_after_mb": memory_after["process_memory_mb"],
                    "memory_delta_mb": round(memory_delta, 2),
                    "memory_before_percent": memory_before["process_memory_percent"],
                    "memory_after_percent": memory_after["process_memory_percent"],
                    "system_memory_percent": memory_after["system_memory_percent"],
                    "execution_time_seconds": round(end_time - start_time, 3),
                    "status": "success"
                }
                
                _record_metric(feature_name, metric)
                
                return result
                
            except Exception as e:
                # Record error metrics
                memory_after = get_memory_usage()
                end_time = time.time()
                
                metric = {
                    "feature": feature_name,
                    "timestamp": datetime.now().isoformat(),
                    "memory_before_mb": memory_before["process_memory_mb"],
                    "memory_after_mb": memory_after["process_memory_mb"],
                    "memory_delta_mb": round(memory_after["process_memory_mb"] - memory_before["process_memory_mb"], 2),
                    "execution_time_seconds": round(end_time - start_time, 3),
                    "status": "error",
                    "error": str(e)
                }
                
                _record_metric(feature_name, metric)
                raise
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def _record_metric(feature_name: str, metric: Dict[str, Any]):
    """Record a memory metric (thread-safe)."""
    with _metrics_lock:
        if feature_name not in _memory_metrics:
            _memory_metrics[feature_name] = []
        _memory_metrics[feature_name].append(metric)
        
        # Keep only last 1000 metrics per feature to prevent memory bloat
        if len(_memory_metrics[feature_name]) > 1000:
            _memory_metrics[feature_name] = _memory_metrics[feature_name][-1000:]


def get_memory_metrics(feature_name: Optional[str] = None, limit: int = 100) -> Dict[str, Any]:
    """
    Get memory metrics for a specific feature or all features.
    
    Args:
        feature_name: Optional feature name to filter by. If None, returns all features.
        limit: Maximum number of metrics to return per feature.
    
    Returns:
        Dictionary with memory metrics aggregated by feature.
    """
    with _metrics_lock:
        if feature_name:
            if feature_name in _memory_metrics:
                metrics = _memory_metrics[feature_name][-limit:]
                return {
                    feature_name: {
                        "metrics": metrics,
                        "count": len(metrics),
                        "latest": metrics[-1] if metrics else None
                    }
                }
            else:
                return {feature_name: {"metrics": [], "count": 0, "latest": None}}
        else:
            result = {}
            for feature, metrics in _memory_metrics.items():
                recent_metrics = metrics[-limit:]
                result[feature] = {
                    "metrics": recent_metrics,
                    "count": len(recent_metrics),
                    "latest": recent_metrics[-1] if recent_metrics else None
                }
            return result


def get_memory_summary() -> Dict[str, Any]:
    """
    Get aggregated memory usage summary across all features.
    
    Returns:
        Dictionary with summary statistics:
        - current_memory: Current process memory usage
        - features: Aggregated stats per feature
    """
    current = get_memory_usage()
    all_metrics = get_memory_metrics()
    
    summary = {
        "current_memory": current,
        "features": {}
    }
    
    for feature_name, feature_data in all_metrics.items():
        metrics = feature_data.get("metrics", [])
        if not metrics:
            continue
        
        # Calculate statistics
        memory_deltas = [m.get("memory_delta_mb", 0) for m in metrics]
        execution_times = [m.get("execution_time_seconds", 0) for m in metrics]
        
        summary["features"][feature_name] = {
            "total_calls": len(metrics),
            "avg_memory_delta_mb": round(sum(memory_deltas) / len(memory_deltas), 2) if memory_deltas else 0,
            "max_memory_delta_mb": round(max(memory_deltas), 2) if memory_deltas else 0,
            "min_memory_delta_mb": round(min(memory_deltas), 2) if memory_deltas else 0,
            "avg_execution_time_seconds": round(sum(execution_times) / len(execution_times), 3) if execution_times else 0,
            "max_execution_time_seconds": round(max(execution_times), 3) if execution_times else 0,
            "error_count": sum(1 for m in metrics if m.get("status") == "error"),
            "latest_metric": feature_data.get("latest")
        }
    
    return summary


def clear_metrics(feature_name: Optional[str] = None):
    """
    Clear memory metrics for a specific feature or all features.
    
    Args:
        feature_name: Optional feature name to clear. If None, clears all metrics.
    """
    with _metrics_lock:
        if feature_name:
            if feature_name in _memory_metrics:
                del _memory_metrics[feature_name]
        else:
            _memory_metrics.clear()

