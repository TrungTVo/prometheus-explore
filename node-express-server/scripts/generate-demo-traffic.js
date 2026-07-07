const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_REQUESTS = 200;
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_DELAY_MS = 250;

const endpoints = [
    '/',
    '/greet/hello-from-traffic',
    '/v1/users',
];

function parsePositiveInteger(name, defaultValue) {
    const rawValue = process.env[name];

    if (!rawValue) {
        return defaultValue;
    }

    const value = Number(rawValue);

    if (!Number.isInteger(value) || value < 1) {
        throw new Error(`${name} must be a positive integer. Received: ${rawValue}`);
    }

    return value;
}

function normalizeBaseUrl(url) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function sendRequest(baseUrl, requestNumber) {
    const endpoint = endpoints[requestNumber % endpoints.length];
    const startedAt = Date.now();
    const response = await fetch(`${baseUrl}${endpoint}`);

    await response.text();

    return {
        endpoint,
        status: response.status,
        durationMs: Date.now() - startedAt,
    };
}

async function main() {
    const baseUrl = normalizeBaseUrl(process.env.BASE_URL || DEFAULT_BASE_URL);
    const totalRequests = parsePositiveInteger('REQUESTS', DEFAULT_REQUESTS);
    const concurrency = parsePositiveInteger('CONCURRENCY', DEFAULT_CONCURRENCY);
    const delayMs = parsePositiveInteger('DELAY_MS', DEFAULT_DELAY_MS);
    const statusCounts = new Map();

    let nextRequest = 0;
    let networkErrors = 0;

    console.log(`Generating ${totalRequests} requests against ${baseUrl}`);
    console.log(`Concurrency: ${concurrency}, per-worker delay: ${delayMs}ms`);

    async function worker() {
        while (nextRequest < totalRequests) {
            const requestNumber = nextRequest;
            nextRequest += 1;

            try {
                const result = await sendRequest(baseUrl, requestNumber);
                const currentCount = statusCounts.get(result.status) || 0;
                statusCounts.set(result.status, currentCount + 1);
                console.log(
                    `[${requestNumber + 1}/${totalRequests}] GET ${result.endpoint} -> ${result.status} in ${result.durationMs}ms`
                );
            } catch (error) {
                networkErrors += 1;
                const message = error instanceof Error ? error.message : String(error);
                console.error(`[${requestNumber + 1}/${totalRequests}] request failed: ${message}`);
            }

            if (delayMs > 0) {
                await sleep(delayMs);
            }
        }
    }

    const workerCount = Math.min(concurrency, totalRequests);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    console.log('Traffic generation complete.');
    console.log(
        `Status counts: ${Array.from(statusCounts.entries())
            .sort(([left], [right]) => left - right)
            .map(([status, count]) => `${status}=${count}`)
            .join(', ')}`
    );

    if (networkErrors > 0) {
        console.error(`Network errors: ${networkErrors}`);
        process.exitCode = 1;
    }
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});
