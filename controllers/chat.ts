import type {Request, Response} from "express";
import { processStream } from '../utils/processStream';
import {getCustomSystemMessage, context} from '../context/messages.ts';

export const parseChatRequest = async (req: Request) => {
    const stream = req.body.stream;
    const messages = req.body.messages;
    messages.shift(); // Remove Alice's app system message.

    /*
     Prepare chat messages for the OpenAI API
     */
    const formattedMessages = [
        ...(await getCustomSystemMessage(context)),
        ...messages,
    ];

    return { stream, messages: formattedMessages };
};

export const chatResponse = async (answer: string | ReadableStream<string>, stream: boolean, res: Response) => {
    if (!stream || typeof answer === 'string') {
        res.json(answer);
    } else {
        res.writeHead(200, {
            'Content-Type': 'application/x-ndjson',
            'Transfer-Encoding': 'chunked',
        });
        await processStream(answer, res);
        res.end();
    }
};