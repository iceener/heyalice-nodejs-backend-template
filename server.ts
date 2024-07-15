import express from 'express';
import { chatEndpoint } from './routes/chat';
import { initializeOpenAI } from './providers/llm.ts';
import bodyParser from "body-parser";

const initializeServer = () => {
    const app = express();
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use(express.json());
    return app;
};

const app = initializeServer();
const openai = initializeOpenAI();

app.post('/api/chat', chatEndpoint(openai));

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
