import type {Request, Response} from "express";
import {chatResponse, parseChatRequest} from '../controllers/chat';
import {respondWithError} from "../utils/respondWithError";

export const chatEndpoint = (openai: any) => async (req: Request, res: Response) => {
    console.log('messages');
    const { stream, messages } = await parseChatRequest(req);

    console.log('messages', messages);

    try {
        const answer = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            stream,
        });
        return chatResponse(answer, stream, res);
    } catch (error) {
        respondWithError(error, res);
    }
};