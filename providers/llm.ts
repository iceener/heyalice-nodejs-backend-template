import { OpenAI } from 'openai';
export const initializeOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

