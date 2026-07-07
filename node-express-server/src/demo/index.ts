import express, { Express, Request, Response } from 'express';
import { config } from 'dotenv';
import { router as userRoute } from './routes/user.route';
import { metricsMiddleware, metricsHandler } from './metrics';
import { withDemoLatencyAndFailure } from './demo-behavior';

config();
const app: Express = express()

const port = process.env.PORT || 3000

app.use(metricsMiddleware);

app.get('/metrics', metricsHandler);

app.get('/', withDemoLatencyAndFailure((req: Request, res: Response) => {
    console.log(`${req.method} ${req.originalUrl}`);
    res.json({ message: 'Hello world!!!' });
}));

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/greet/:msg', withDemoLatencyAndFailure((req: Request, res: Response) => {
    console.log(`${req.method} ${req.originalUrl}`);
    res.json({ message: req.params });
}));

app.use('/v1', userRoute);

app.listen(port, () => {
	console.log(`Server listening on port ${port}...`)
})
