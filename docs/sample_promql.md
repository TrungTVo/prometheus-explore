# Sample PromQL Queries for API Monitoring

## 1. Total Requests Count
```promql
sum by (route, status_code) (demo_node_express_http_requests_total)
```

## 2. Request rate (traffic) — requests per second
```promql
sum by (route, status_code) (rate(demo_node_express_http_request_duration_seconds_count[1m]))
```

## 3. Error rate — fraction of requests returning 5xx
```promql
sum by (route) (rate(demo_node_express_http_request_duration_seconds_count{status_code=~"5.."}[3h]))
/
sum by (route) (rate(demo_node_express_http_request_duration_seconds_count[3h]))
```

*or we can also use the following query to get the overall error rate across all routes:*

```promql
sum (rate(demo_node_express_http_request_duration_seconds_count{status_code=~"5.."}[3h]))
/
sum (rate(demo_node_express_http_request_duration_seconds_count[3h]))
```

## 4. Latency — p50, p95, p99
```promql
histogram_quantile(0.50, sum by (le, route) (rate(demo_node_express_http_request_duration_seconds_bucket[5m])))
```
```promql
histogram_quantile(0.95, sum by (le, route) (rate(demo_node_express_http_request_duration_seconds_bucket[5m])))
```
```promql
histogram_quantile(0.99, sum by (le, route) (rate(demo_node_express_http_request_duration_seconds_bucket[5m])))
```