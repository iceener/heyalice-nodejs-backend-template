import type { Response } from 'express';
export const respondWithError = (error: any, res: Response) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    console.error('Error processing OpenAI API request:', error);
    res.end();
};