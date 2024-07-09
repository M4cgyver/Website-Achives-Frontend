import { Readex_Pro } from "next/font/google";
import { Readable } from "stream";

export type mWarcHeaderMap = { [key: string]: any };
export type mWarcReadFunction = (offset: bigint, size: bigint) => Promise<Buffer>
export type mWarcCallbackFunction = (header: mWarcHeaderMap, content?: Blob) => void;
export type mWarcAsyncItter = AsyncIterable<[mWarcHeaderMap, Buffer?]>;
export type mWarcResponsesAsyncItter = AsyncIterable<[mWarcHeaderMap, mWarcHeaderMap, mWarcHeaderMap, Buffer?]>;

export interface mWarcParseWarcOptions {
    callback?: mWarcCallbackFunction;
    skipContent?: boolean;
    readBufferSize?: bigint;
    signal?: AbortSignal;
}

export function hexToBn(hex: string, options?: { unsigned?: boolean }): bigint {
    const unsigned = options?.unsigned ?? false;

    if (hex.length % 2 || hex.length === 0) {
        hex = '0' + hex;
    }

    const bn = BigInt('0x' + hex);

    if (unsigned) {
        return bn;
    }

    // Check if the highest bit of the highest byte is set (sign bit)
    const highByte = parseInt(hex.slice(0, 2), 16);
    if (highByte >= 128) {
        // Calculate two's complement (flip bits, add one)
        const flipped = bn ^ ((1n << BigInt(hex.length * 4)) - 1n);
        return -flipped - 1n;
    }

    return bn;
}


export const mWarcParseHeader = (s: string): mWarcHeaderMap => {
    const lines = s.split("\r\n");

    const firstLine = lines[0];
    const httpRegex = /^HTTP\/(\d+\.\d+)\s+(\d+)\s+(.*)$/;
    const httpMatches = firstLine.match(httpRegex);

    const httpHeader = httpMatches ? {
        http: httpMatches[1],
        status: parseInt(httpMatches[2], 10),
        message: httpMatches[3].trim()
    } : {};

    const headers = lines
        .slice(1)
        .filter(line => line.trim() !== "")
        .reduce((acc: mWarcHeaderMap, line) => {
            const index = line.indexOf(":");
            if (index !== -1) {
                const key = line.slice(0, index).trim().toLowerCase();
                const value = line.slice(index + 1).trim();
                return { ...acc, [key]: value };
            }
            return acc;
        }, {});

    return { ...headers, ...httpHeader };
};

export const mWarcParse = (
    read: mWarcReadFunction,
    options?: mWarcParseWarcOptions
): mWarcAsyncItter => {
    const skipContent = options?.skipContent || false;
    const readBufferSize = options?.readBufferSize || 512n + 256n;
    const signal = options?.signal;

    let backbuffer: string = "";
    let offset = 0n;
    let done = false;

    return {
        [Symbol.asyncIterator]() {
            return {
                async next(): Promise<IteratorResult<[mWarcHeaderMap, Buffer?]>> {
                    if (done) {
                        return { done: true, value: undefined };
                    }

                    console.log(signal?.aborted);

                    if (signal?.aborted) {
                        done = true;
                        return { done: true, value: undefined };
                    }

                    let content: Buffer | undefined = undefined;
                    let bufferToParse: string = backbuffer;
                    let bufferChunks: Array<string> = [];

                    try {
                        while (bufferChunks.length < 2) {
                            const newChunks = bufferToParse.split("\r\n\r\n");
                            bufferChunks = (newChunks != null) ? newChunks : bufferChunks;

                            if (bufferChunks.length < 2) {
                                const possiblePromise = await read(offset, readBufferSize);
                                bufferToParse += possiblePromise.toString();

                                offset += readBufferSize;
                            }
                        }

                        const header: mWarcHeaderMap = mWarcParseHeader(bufferChunks[0]);

                        const contentLength = header['content-length'] ? BigInt(header['content-length']) : 0n;

                        const remainingBytes = contentLength - BigInt(bufferToParse.length - bufferChunks[0].length - 4);
                        content = skipContent ? undefined :
                            Buffer.from(bufferToParse.slice(bufferChunks[0].length + 4, bufferChunks[0].length + 4 + Number(contentLength)) +
                                ((remainingBytes > 0n) ? (await read(offset, remainingBytes)).toString() : ""));
                        offset += remainingBytes > 0n ? remainingBytes : 0n;
                        backbuffer = remainingBytes < 0n ? bufferToParse.slice(bufferToParse.length + Number(remainingBytes) + 4) : "";

                        return {
                            done: false,
                            value: [{ ...header, offset: offset }, content],
                        };
                    } catch (err) {
                        if (err instanceof RangeError) {
                            done = true;
                            return { done: true, value: undefined };
                        } else {
                            throw err;
                        }
                    }
                }
            };
        }
    };
};

export const mWarcParseResponses = (
    read: mWarcReadFunction,
    options?: { skipContent?: boolean, readBufferSize?: bigint }
): mWarcResponsesAsyncItter => {
    const skipContent = options?.skipContent || false;
    const readBufferSize = options?.readBufferSize || 512n + 256n;

    let backbuffer: string = "";
    let offset = 0n;
    let done = false;

    return {
        [Symbol.asyncIterator](): AsyncIterator<[mWarcHeaderMap, mWarcHeaderMap, mWarcHeaderMap, Buffer?]> {
            return {
                async next(): Promise<IteratorResult<[mWarcHeaderMap, mWarcHeaderMap, mWarcHeaderMap, Buffer?]>> {
                    if (done) {
                        return { done: true, value: undefined as any };
                    }

                    let content: Buffer | undefined = undefined;
                    let header: mWarcHeaderMap | undefined;
                    let http: mWarcHeaderMap = {};
                    let metadata: mWarcHeaderMap = {
                        recordWarcOffset: 0n,
                        recordResponseOffset: 0n,
                        recordContentOffset: 0n,
                    };

                    try {
                        do {
                            let bufferToParse: string = backbuffer;
                            let bufferChunks: Array<string> = [];
                            metadata.recordWarcOffset = offset - BigInt(bufferToParse.length);

                            while (bufferChunks.length < 2) {
                                const newChunks = bufferToParse.split("\r\n\r\n");
                                bufferChunks = newChunks.length > 1 ? newChunks : bufferChunks;

                                if (bufferChunks.length < 2) {
                                    const possiblePromise = await read(offset, readBufferSize);
                                    bufferToParse += possiblePromise.toString();

                                    offset += readBufferSize;
                                }
                            }

                            header = mWarcParseHeader(bufferChunks[0]);

                            const contentLength = header['content-length'] ? BigInt(header['content-length']) : 0n;

                            if (header['warc-type'] !== 'response' || contentLength === 0n) {
                                const remainingBytes = contentLength - BigInt(bufferToParse.length - bufferChunks[0].length - 4);
                                offset += remainingBytes > 0n ? remainingBytes : 0n;
                                backbuffer = remainingBytes < 0n ? bufferToParse.slice(bufferToParse.length + Number(remainingBytes) + 4) : "";

                            } else {
                                while (bufferChunks.length < 3) {
                                    const newChunks = bufferToParse.split("\r\n\r\n");
                                    bufferChunks = newChunks.length > 2 ? newChunks : bufferChunks;

                                    if (bufferChunks.length < 3) {
                                        const possiblePromise = await read(offset, readBufferSize);
                                        bufferToParse += possiblePromise.toString();

                                        offset += readBufferSize;
                                    }
                                }

                                http = mWarcParseHeader(bufferChunks[1]);
                                const httpContentLength = contentLength - BigInt(bufferChunks[1].length);

                                const remainingBytes = httpContentLength - BigInt(bufferToParse.length - bufferChunks[0].length - bufferChunks[1].length - 8);
                                content = skipContent ? undefined :
                                    Buffer.from(bufferToParse.slice(bufferChunks[0].length + bufferChunks[1].length + 8, bufferChunks[0].length + bufferChunks[1].length + 8 + Number(httpContentLength)) +
                                        ((remainingBytes > 0n) ? (await read(offset, remainingBytes)).toString() : ""));
                                offset += remainingBytes > 0n ? remainingBytes : 0n;
                                backbuffer = remainingBytes < 0n ? bufferToParse.slice(bufferToParse.length + Number(remainingBytes) + 4) : "";

                                metadata.recordResponseOffset = metadata.recordWarcOffset + BigInt(bufferChunks[0].length + 4);
                                metadata.recordContentOffset = metadata.recordResponseOffset + BigInt(bufferChunks[1].length + 4);

                                http['content-length'] = httpContentLength;
                            }
                        } while (header && header['warc-type'] !== 'response');

                        if (!header) {
                            done = true;
                            return { done: true, value: undefined as any };
                        }

                        return {
                            done: false,
                            value: [header, http, metadata, content],
                        };
                    } catch (err) {
                        if (err instanceof RangeError) {
                            done = true;
                            return { done: true, value: undefined as any };
                        } else {
                            throw err;
                        }
                    }
                }
            };
        }
    };
};

export const mWarcParseResponseContent = (
    content: Buffer,
    transferEncoding: string | "chunked" | "compress" | "deflate" | "gzip" | undefined
): Promise<Buffer> => {

    switch (transferEncoding) {
        case "chunked": //FUCK THIS PIECE OF SHIT

            let chHex = "";
            let chOffset = 0n;
            let chPosition = 0n;

            const chunkPromise = (chunk: string | Buffer) => {
                let filtered = "";

                if (chOffset > BigInt(chunk.length)) {
                    chOffset -= BigInt(chunk.length);
                    return chunk;
                }

                chPosition = chOffset;

                while (chPosition < chunk.length) {
                    const chHexC = chunk instanceof Buffer
                        ? String.fromCharCode(chunk[Number(chPosition)])
                        : typeof chunk === 'string'
                            ? chunk.charAt(Number(chPosition))
                            : '';   //TODO: better error handling here
                    chHex += chHexC;
                    chPosition++;

                    if (chHex.endsWith("\r\n") && chHex !== "0\r\n") {
                        ;
                        chOffset = hexToBn(chHex.slice(0, chHex.length - 2), { unsigned: true });
                        //console.log("hex", chHex, chOffset)
                        const startSlice = chPosition
                        const endSlice = chPosition + chOffset;
                        const slice = chunk.slice(Number(startSlice), Number(endSlice));
                        filtered += slice.toString();
                        chPosition += chOffset + 2n /*2 for the \r\n after the chunk, who the fuck wrote this protocoll???? */;
                        const rem = chunk.length - Number(chPosition);
                        chOffset -= BigInt(slice.length) - 2n;
                        chHex = "";

                    } else if (chHex.endsWith("\r\n") && chHex === "0\r\n") {
                        break;
                    }
                }

                return filtered
            }

            /*
            For NodeJS.ReadableStream
            return content.pipe(new Transform({
                transform(chunk: string | Buffer, encoding: string, callback) {
                    callback(null, chunkPromise(chunk));
                }
            }));
            */

            const parsed: Buffer | string = chunkPromise(content) 
            
            return Promise.resolve((typeof parsed == "string") ? Buffer.from(parsed) : parsed);

        default:
            return Promise.resolve(content);
    }

}