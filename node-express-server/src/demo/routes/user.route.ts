import express, { Request, Response, Router } from 'express';
import { withDemoLatencyAndFailure } from '../demo-behavior';

export const router: Router = express.Router();

router.get('/users', withDemoLatencyAndFailure((req: Request, res: Response) => {
    console.log(`${req.method} ${req.originalUrl}`);
    res.json({
        users: [
            { name: 'Trung Vo', age: 28, role: 'software dev' },
            { name: 'Aiko Chu', age: 28, role: 'medical doctor' }
        ]
    })
}));
