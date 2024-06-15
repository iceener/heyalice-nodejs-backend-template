import express from 'express';
import { chatEndpoint } from './routes/chat';
import { initializeOpenAI } from './providers/llm.ts';

const initializeServer = () => {
    const app = express();
    app.use(express.json());
    return app;
};

const app = initializeServer();
const openai = initializeOpenAI();

app.post('/api/chat', chatEndpoint(openai));

const port = process.env.PORT || 3005;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
