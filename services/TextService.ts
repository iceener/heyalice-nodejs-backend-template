import { get_encoding } from 'tiktoken';

type Headers = {
    h1?: string[];
    h2?: string[];
    h3?: string[];
    h4?: string[];
    h5?: string[];
    h6?: string[];
};

export interface IDoc {
    text: string;
    metadata: {
        tokens: number,
        headers: Headers,
        urls: string[],
        images: string[],
        sourceTitle: string,
        sourceUrl: string
    }
}

interface  IChunk {
    text: string;
    tokens: number;
    headers: Headers;
}

export class TextService {
    private enc;
    private strategies;
    private latestHeaders: Headers = {};

    constructor() {
        this.enc = get_encoding('cl100k_base');
        this.strategies = [
            { name: 'headers', regex: /(?=\n#{1,6}\s)/ },
            { name: 'paragraphs', regex: /(\n\n|\n)/ },
            { name: 'sentences', regex: /(?<=\.)\s+/ },
            { name: 'lines', regex: /\n/ },
            { name: 'words', regex: /\s+/ },
            { name: 'characters', regex: /(?<=.)/ },
        ];
    }

    /**
     * Main function to split text into chunks based on token limit.
     * @param {string} text - The text to split.
     * @param {number} limit - The token limit for each chunk.
     * @param {boolean} e - Whether to use the encoding for the model.
     */
    async split(text: string, limit: number, e = false): Promise<any> {
        this.latestHeaders = {}; // Reset latest headers
        const initialChunks: IChunk[] = [{ text, tokens: this.enc.encode(text).length, headers: {} }];
        const finalResult = await this.recursiveSplit(initialChunks, 0, limit);
        return finalResult.map((chunk: any) => {
            const { content, headers, urls, images } = this._extractHeadersAndMetadata(chunk.text);
            return {
                text: content,
                metadata: {
                    tokens: chunk.tokens,
                    headers,
                    urls,
                    images,
                },
            };
        });
    }
    /**
     * Recursively splits chunks using different strategies.
     * @param {Array} chunks - Array of chunks to split.
     * @param {number} strategyIndex - Index of the current strategy.
     * @param {number} limit - The token limit for each chunk.
     * @returns {Array} - Array of split chunks.
     */
    async recursiveSplit(chunks: IChunk[], strategyIndex: number, limit: number): Promise<IChunk[]> {
        if (strategyIndex >= this.strategies.length) return chunks;
        const { regex } = this.strategies[strategyIndex];
        let splitChunks = chunks.flatMap((chunk) => this.splitChunksByStrategy(chunk, regex));
        if (splitChunks.some((chunk) => chunk.tokens > limit)) {
            splitChunks = await this.recursiveSplit(splitChunks, strategyIndex + 1, limit);
        } else {
            splitChunks = this.mergeChunks(splitChunks, limit);
        }
        return splitChunks;
    }
    /**
     * Splits a chunk using a specific regex strategy.
     * @param {Object} chunk - The chunk to split.
     * @param {RegExp} regex - The regex to use for splitting.
     * @returns {Array} - Array of split chunks.
     */
    splitChunksByStrategy(chunk: IChunk, regex: RegExp) {
        return chunk.text
            .split(regex)
            .map((part) => (part.trim() ? part : '\n')) // Preserve single newlines
            .map((part) => {
                const tokens = this.enc.encode(part).length;
                const headers = this._extractHeaders(part); // Extract headers
                return {
                    text: part,
                    tokens,
                    headers,
                };
            });
    }
    /**
     * Merges small chunks into larger ones within the token limit.
     * @param {Array} chunks - Array of chunks to merge.
     * @param {number} limit - The token limit for each chunk.
     * @returns {Array} - Array of merged chunks.
     */
    mergeChunks(chunks: IChunk[], limit: number) {
        const result = [];
        let buffer: IChunk = { text: '', tokens: 0, headers: {} };
        for (const chunk of chunks) {
            if (buffer.tokens + chunk.tokens <= limit) {
                buffer.text += buffer.text ? chunk.text : chunk.text; // Preserve newlines
                buffer.tokens += chunk.tokens;
                // Merge headers, ensuring no overwriting
                for (const level in chunk.headers) {
                    const key = level as keyof Headers;
                    if (!buffer.headers[key]) {
                        buffer.headers[key] = [];
                    }
                    if (chunk.headers[key] !== undefined) {
                        buffer.headers[key]!.push(...chunk.headers[key]!); // Only spread if chunk.headers[key] is not undefined
                    }
                }
            } else {
                if (buffer.text) {
                    result.push({ ...buffer });
                }
                buffer = { text: chunk.text, tokens: chunk.tokens, headers: { ...chunk.headers } };
            }
        }
        if (buffer.text) {
            result.push({ ...buffer });
        }
        return result.filter((chunk) => chunk.tokens > 0); // Ensure no empty chunks
    }

    /**
     * Extracts headers, URLs, and images from the text and updates the metadata.
     * @param {string} text - The text to extract from.
     * @returns {Object} - Object containing updated text, headers, URLs, and images.
     */
    _extractHeadersAndMetadata(text: string): any {
        const { content, urls, images } = this._extractUrlsAndImages(text);
        const headers = this._extractHeaders(content);
        // Merge with the latest headers
        for (const level in headers) {
            const key = level as keyof Headers;
            this.latestHeaders[key] = headers[key];
        }
        // Ensure all levels are present in metadata
        const metadataHeaders = { ...this.latestHeaders };
        return { content, headers: metadataHeaders, urls, images };
    }
    /**
     * Extracts URLs and images from the text and replaces them with tokens.
     * @param {string} text - The text to extract from.
     * @returns {Object} - Object containing updated text, URLs, and images.
     */
    _extractUrlsAndImages(text: string): any {
        let urlIndex = 0;
        let imgIndex = 0;
        const urls: string[] = [];
        const images: string[] = [];
        let content = text.replace(/(\[([^\]]+)\]\(([^)]+)\))/g, (match, fullMatch, text, url) => {
            urls.push(url);
            return `[${text}]({{$url${urlIndex++}}})`;
        });
        content = content.replace(/(!\[([^\]]*)\]\(([^)]+)\))/g, (match, fullMatch, alt, url) => {
            images.push(url);
            return `![${alt}]({{$img${imgIndex++}}})`;
        });
        return { content, urls, images };
    }
    /**
     * Extracts headers from the text.
     * @param {string} text - The text to extract headers from.
     * @returns {Object} - Object containing headers.
     */
    _extractHeaders(text: string): Headers {
        const headers: Headers = {};
        const headerRegex = /^(#{1,6})\s(.*)$/gm;
        let match;
        while ((match = headerRegex.exec(text)) !== null) {
            const level = match[1].length;
            const headerContent = match[2].trim();
            const key = `h${level}` as keyof Headers;
            if (!headers[key]) {
                headers[key] = [];
            }
            headers?.[key]?.push(headerContent);
        }
        return headers;
    }

}