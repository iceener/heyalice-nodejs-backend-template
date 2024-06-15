/*
Static Context
 */
import {IDoc, TextService} from "../services/TextService.ts";

export const context = `Alice app is an interface for communicating with large language models, which you can connect directly to OpenAI/Anthropic/Groq/Ollama or your own server.`;

export const getCustomSystemMessage = async (context: string) => {

    const docs = await new TextService().split(context, 3500);

    return [
        {
            role: "system",
            content: `You're Alice, an AI assistant chatting with the user. 

In your conversation with the user, you can answer questions using the context below and nothing else. When you don't know the answer, say truthfully "I don't know" in your own words.

<contexts>${docs.map((doc: IDoc)=> `<context>${doc.text}</context>`).join('\n')}</contexts>

Note: Use information from the context only when asked for it.`
        }
    ];
};