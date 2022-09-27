import express, { Response, Request } from "express";
import { pusherConfig } from "../utils";
import Pusher from 'pusher';

export const chatRouterInit = () => {
    const router = express.Router();

    const pusher = new Pusher(pusherConfig());

    router.post('/message', (req: Request, res: Response) => {
        const payload = req.body;
        pusher.trigger('chat', 'message', payload);
        res.send(payload)
    });
    return router;
}
