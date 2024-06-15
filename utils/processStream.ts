import type { Response } from 'express';
export const processStream = async (stream: ReadableStream, res: Response) => {
    for await (const chunk of stream) {
        const response = {
            model: "gpt-4",
            created_at: new Date().toISOString(),
            message: { content: chunk.choices[0]?.delta?.content || '' },
            done: chunk.choices[0]?.delta?.index === null
        };
        res.write(JSON.stringify(response) + '\n');
    }
};