import { NextFunction, Request, RequestHandler, Response } from 'express';

export const MIN_DEMO_DELAY_MS = 100;
export const MAX_DEMO_DELAY_MS = 2000;
export const DEMO_FAILURE_LIMIT = 20;

type RandomSource = () => number;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function getRandomInt(min: number, max: number, random: RandomSource = Math.random): number {
    return Math.floor(random() * (max - min + 1)) + min;
}

export function getRandomDelayMs(random: RandomSource = Math.random): number {
    return getRandomInt(MIN_DEMO_DELAY_MS, MAX_DEMO_DELAY_MS, random);
}

export function shouldReturnDemoFailure(roll: number): boolean {
    return roll % 3 === 0;
}

export function withDemoLatencyAndFailure(handler: RequestHandler): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await sleep(getRandomDelayMs());

            const failureRoll = getRandomInt(1, DEMO_FAILURE_LIMIT);

            if (shouldReturnDemoFailure(failureRoll)) {
                res.status(500).json({
                    error: 'Intentional demo internal server error',
                    demoFailure: true,
                    failureRoll,
                });
                return;
            }

            await Promise.resolve(handler(req, res, next));
        } catch (error) {
            next(error);
        }
    };
}
