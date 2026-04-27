import express, { Request, Response, Router } from 'express';
export const router: Router = express.Router();

router.get('/users', (req: Request, res: Response) => {
    console.log(`${req.method} ${req.originalUrl}`);
    res.json({
        users: [
            { name: 'Trung Vo', age: 28, role: 'software dev' },
            { name: 'Aiko Chu', age: 28, role: 'medical doctor' }
        ]
    })
})