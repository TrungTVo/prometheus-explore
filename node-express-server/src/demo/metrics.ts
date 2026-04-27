import { Request, Response, NextFunction } from 'express';
import {
    Registry,
    collectDefaultMetrics,
    Counter,
    Histogram,
    Gauge,
} from 'prom-client';

const PREFIX = 'demo_node_express_';

export const register = new Registry();

register.setDefaultLabels({ app: 'demo-node-express-server' });

collectDefaultMetrics({ register, prefix: PREFIX });

const httpRequestsTotal = new Counter({
    name: `${PREFIX}http_requests_total`,
    help: 'Total number of HTTP requests handled',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [register],
});

const httpRequestDurationSeconds = new Histogram({
    name: `${PREFIX}http_request_duration_seconds`,
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
});

const httpRequestsInFlight = new Gauge({
    name: `${PREFIX}http_requests_in_flight`,
    help: 'Number of HTTP requests currently being processed',
    labelNames: ['method'] as const,
    registers: [register],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (req.path === '/metrics') {
        return next();
    }

    const method = req.method;
    httpRequestsInFlight.inc({ method });
    const endTimer = httpRequestDurationSeconds.startTimer();

    res.on('finish', () => {
        const route = req.route?.path
            ? `${req.baseUrl}${req.route.path}`
            : req.path;
        const status_code = String(res.statusCode);
        const labels = { method, route, status_code };
        endTimer(labels);
        httpRequestsTotal.inc(labels);
        httpRequestsInFlight.dec({ method });
    });

    next();
}

export async function metricsHandler(_req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
}
