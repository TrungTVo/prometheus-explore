## Run
```
docker compose up -d
```

## Demo API traffic

The demo Node Express server intentionally adds 100-2000ms of latency to these
endpoints:

- `GET /`
- `GET /greet/:msg`
- `GET /v1/users`

Each request rolls a random number from 1 to 20. If the roll is a multiple of 3,
the endpoint returns an intentional `500` response; otherwise it returns its
normal `200` response.

Generate virtual API traffic:

```bash
cd node-express-server
npm run traffic:demo
```

Useful overrides:

```bash
REQUESTS=500 CONCURRENCY=10 npm run traffic:demo
BASE_URL=http://localhost:3000 REQUESTS=100 DELAY_MS=100 npm run traffic:demo
```

Prometheus queries:

```promql
sum by (route, status_code) (rate(demo_node_express_http_requests_total[1m]))
```

```promql
histogram_quantile(0.95, sum by (le, route) (rate(demo_node_express_http_request_duration_seconds_bucket[5m])))
```
