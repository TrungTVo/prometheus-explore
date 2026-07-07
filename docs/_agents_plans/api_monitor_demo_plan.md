# Demo API Latency and Failure Simulation Plan

## Summary
Add reusable demo behavior to the Node Express server so `GET /`, `GET /greet/:msg`, and `GET /v1/users` each wait 100-2000 ms, then randomly either return their normal `200` response or an intentional `500`. Add an npm traffic script to generate repeated requests so Prometheus can show request volume, latency, and error-rate metrics.

## Key Changes
- Add a shared route wrapper, likely `node-express-server/src/demo/demo-behavior.ts`, with:
  - random delay between `100` and `2000` ms
  - random integer from `1` to `20`
  - return `500` when the number is a multiple of `3`
  - otherwise call the normal route handler
- Apply the wrapper only to demo API endpoints:
  - `GET /`
  - `GET /greet/:msg`
  - `GET /v1/users`
- Leave `/metrics` and `/favicon.ico` untouched so Prometheus scraping and browser favicon requests stay reliable.
- Add `node-express-server/scripts/generate-demo-traffic.js` using built-in Node `fetch`, no new dependencies.
- Add `npm run traffic:demo` with env controls:
  - `BASE_URL`, default `http://localhost:3000`
  - `REQUESTS`, default `200`
  - `CONCURRENCY`, default `5`
  - `DELAY_MS`, default `250`
- Update `README.md` with demo commands and Prometheus query examples for request totals, error rate, and latency percentiles.

## Public Interfaces
- Existing endpoints keep their normal `200` JSON shape when successful.
- Intentional failures return HTTP `500` with a small JSON body identifying it as a demo failure.
- New CLI entrypoint:
  - `cd node-express-server && npm run traffic:demo`
  - Example: `REQUESTS=500 CONCURRENCY=10 npm run traffic:demo`
- Example traffic run:
  - `REQUESTS=120 CONCURRENCY=8 DELAY_MS=50 npm run traffic:demo`
  - `REQUESTS=120` means the script sends 120 total API requests.
  - `CONCURRENCY=8` means up to 8 worker loops send requests in parallel until all 120 are completed.
  - `DELAY_MS=50` means each worker waits 50 ms after a request before starting its next request.
  - Endpoint selection is deterministic, not random. The script rotates through `/`, `/greet/hello-from-traffic`, and `/v1/users` using `requestNumber % endpoints.length`.
  - Because 120 divides evenly by 3, each endpoint receives 40 requests. The endpoint choice is fixed; the `200` versus intentional `500` response is randomized by the Express route behavior.

## Test Plan
- Run `cd node-express-server && npm run build`.
- Start the app with Docker Compose or `npm run start:demo`.
- Smoke test:
  - call each endpoint several times and confirm both `200` and occasional `500` responses appear.
  - run `npm run traffic:demo` and confirm it completes even when some requests return `500`.
- Verify Prometheus metrics include both success and failure status labels. Use sample PromQL queries in `docs/sample_promql.md`.

## Assumptions
- The intentional `500` rate is fixed by the requested rule: multiples of `3` from `1..20`, so roughly `30%`.
- Mixed latency means uniformly randomized `100..2000` ms per request.
- `dist/` is generated output and not tracked, so implementation updates TypeScript source only.
- No Prometheus config change is required because the existing scrape job already targets the Express server.
