"use client"

import { WarcRecord } from "./libs";
import { mWarcParseResponses, mWarcParseResponseContent } from "./mwarc";

let lastOnMessageEventListener: null | ((event: MessageEvent) => void) = null;

export const hookOnMessageEventListener = (options?: { iframe: HTMLIFrameElement | null | undefined, records: WarcRecord[] }) => {
    console.log("HOOKING EVENT LISTENER", lastOnMessageEventListener);

    const iframe = options?.iframe;
    const records = options?.records;

    const handler = (e: MessageEvent) => {
        //console.log("Message from iFrame", e.data);
        const data = e.data;
        const { action } = data;

        if (action == 'redirect' && data.url) {
            displayRecord(decodeURIComponent(data.url), iframe, { records: records });
        }
    }

    if (lastOnMessageEventListener) {
        window.removeEventListener('message', lastOnMessageEventListener, false);
        lastOnMessageEventListener = null;
    }

    lastOnMessageEventListener = handler;

    window.addEventListener('message', handler, false);
}

export const parseFiles = async (files: File[], records: WarcRecord[]) => {
    try {
        return Promise.all(files.map(async file => {
            console.log("Parsing ", file);
            const read = (offset: bigint, size: bigint) =>
                file.slice(Number(offset), Number(offset + size)).arrayBuffer()
                    .then(slice => Buffer.from(slice));

            for await (const record of mWarcParseResponses(read, { skipContent: true })) {
                const [header, http, metadata, content] = record;

                //console.log(record);
                //console.log(header);

                const size = http['content-length'] && !isNaN(Number(http['content-length'])) ? BigInt(http['content-length']) : 0n;
                const offset = BigInt(metadata['recordContentOffset']);

                ///console.log(http);

                const newRecord: WarcRecord = {
                    uri: header['warc-target-uri']?.replace(/<|>/g, ''),
                    status: http['status'],
                    ip: header['warc-ip-address'],
                    size: size,
                    date: new Date(header['warc-date']),
                    location: http['location'] ?? http['Location'],
                    contentType: http['content-type'],

                    /*
                    ...((header['warc-type'] === 'response' && header['offset'] && !isNaN(Number(header['offset'])) && header['content-length'] && !isNaN(Number(header['content-length']))) ? {
                        content: () => file.slice(Number(header['offset']), Number(header['offset']) + Number(header['content-length']))
                            .arrayBuffer()
                            .then(slice => Buffer.from(slice))
                    } : { content: null })
                    */

                    content: async () => {
                        const slice = await file.slice(Number(offset), Number(offset + size)).arrayBuffer().then(slice => Buffer.from(slice));

                        if (http['transfer-encoding'] === "chunked") {
                            return mWarcParseResponseContent(slice, "chunked");
                        } else {
                            return slice;
                        }
                    }

                };

                //console.log(newRecord.uri);
                //console.log(await newRecord.content());

                records.push(newRecord);
            }

            console.log("Parsed ", file);
        }));
    } catch (error) {
        console.error("Error parsing files:", error);
        // Handle error as per your application's requirements
    }
};

const recordsCache: Map<WarcRecord, {
    blob: Blob;
    objectURL: string;
    foundRecord: WarcRecord;
}> = new Map();

export const getRecord = async (record: WarcRecord | string, options?: { records?: WarcRecord[], redirect?: boolean, referenced?: string[] }): Promise<any> => {
    console.log("Getting record ", record);

    const redirect = options?.redirect ?? false;
    const records = options?.records ?? [];
    const referenced = options?.referenced ?? [];

    const foundRecord = typeof record === "string" ? records.find(r => r.uri === record) : record;

    if (!foundRecord) {
        throw new Error(`Record not found, ${record}`);
    }

    referenced.push(foundRecord.uri);

    const redirectStatuses = [301, 302, 303, 307, 308];

    const cachedRecord = recordsCache.get(foundRecord);
    if (cachedRecord) return Promise.resolve(cachedRecord);

    if (redirectStatuses.includes(foundRecord.status))
        return getRecord(foundRecord.location ?? `ERR_REDIRECT_BUT_NO_LOCATION_${encodeURIComponent(foundRecord.uri)}`, { ...options, referenced: referenced });

    return Promise.all([Promise.resolve(foundRecord.content?.() ?? Buffer.from([]))]).then(async ([content]) => {
        if (redirect) {

            if (foundRecord.contentType?.includes("text/html")) {
                console.log("Handling redirect", foundRecord.uri, foundRecord.contentType)

                // Get the content as a string
                let str = content.toString();

                /// Parse all of the hrefs and srcs
                const rSrcHrefNoLink = /(<(?!a\b)[^>]*(?:\ssrc="([^"]*)"|\shref="([^"]*)").*?>)/gi;
                let matches: { fullMatch: string, url: string | undefined }[] = [];
                let match: RegExpExecArray | null;

                // Collect all matches
                while ((match = rSrcHrefNoLink.exec(str)) !== null) {
                    matches.push({ fullMatch: match[0], url: match[2] || match[3] });
                }

                console.log(matches);

                // Process each match asynchronously
                for (const match of matches) {
                    const { fullMatch, url } = match;

                    console.log("HANDING MATCH", foundRecord.uri, url);

                    if (url) {
                        const newUrl = new URL(url, foundRecord.uri);
                        const result = /*foundRecord.uri == newUrl.href*/ referenced.includes(newUrl.href) ? `ERR_SELF_REF_RECORD_${encodeURIComponent(newUrl.href)}` : (await getRecord(newUrl.href, { records: records, redirect: true, referenced: referenced }).catch(err => { console.log(err); }));
                        const newElem = fullMatch.replace(url, typeof result === "string" ? result : result?.objectURL ?? `ERR_NO_RECORD_FOUND_${encodeURIComponent(newUrl.href)}`);
                        console.log("ELEM", fullMatch, newElem);
                        str = str.replace(fullMatch, newElem);
                    }
                }

                /// Parse all of the a links
                const rHrefInA = /<a\s+[^>]*href="([^"]*)"[^>]*>/gi;
                matches = [];

                // Collect all matches
                while ((match = rHrefInA.exec(str)) !== null) {
                    console.log("A LINK", match);
                    matches.push({ fullMatch: match[0], url: match[1] });
                }

                console.log("A LINK MATCHES", matches)

                // Process each match asynchronously
                for (const match of matches) {
                    const { fullMatch, url } = match;

                    console.log("HANDLING MATCH", foundRecord.uri, url);

                    if (url) {
                        const newUrl = new URL(url, foundRecord.uri);
                        const encodedUrl = encodeURIComponent(newUrl.href);
                        const newElem = fullMatch.replace(
                            `href="${url}"`,
                            `href="#" onclick="window.parent.postMessage({action: 'redirect', url: '${encodedUrl}'}, '*'); return false;"`
                        );
                        console.log("ELEM", fullMatch, newElem);
                        str = str.replace(fullMatch, newElem);
                    }
                }

                console.log("FINAL HTML", str);


                return { content: Buffer.from(str), foundRecord };

            } else if (foundRecord.contentType?.includes("text/css")) {
                console.log("Handling redirect", foundRecord.uri, foundRecord.contentType)

                let str = content.toString();

                const urlPattern = /url\((['"]?)([^'")]*?)\1\)/gi;

                const matches: { fullMatch: string, url: string | undefined }[] = [];
                let match: RegExpExecArray | null;

                // Collect all matches
                while ((match = urlPattern.exec(str)) !== null) {
                    matches.push({ fullMatch: match[0], url: match[2] || match[3] });
                }

                console.log(matches);

                // Process each match asynchronously
                for (const match of matches) {
                    const { fullMatch, url } = match;

                    console.log("HANDING MATCH", foundRecord.uri, url);

                    if (url) {
                        const newUrl = new URL(url, foundRecord.uri);
                        const result = /*foundRecord.uri == newUrl.href*/ referenced.includes(newUrl.href) ? `ERR_SELF_REF_RECORD_${encodeURIComponent(newUrl.href)}` : (await getRecord(newUrl.href, { records: records, redirect: true, referenced: referenced }).catch(err => { console.log(err); }));
                        const newElem = fullMatch.replace(url, typeof result === "string" ? result : result?.objectURL ?? `ERR_NO_RECORD_FOUND_${encodeURIComponent(newUrl.href)}`);
                        console.log("ELEM", fullMatch, newElem);
                        str = str.replace(fullMatch, newElem);
                    }
                }

                console.log(str);

                return { content: Buffer.from(str), foundRecord };
            }
        }

        return { content, foundRecord };

    }).then(async ({ content, foundRecord }) => {
        const headers = new Headers();
        headers.append('Content-Type', foundRecord.contentType ?? "text/plain");

        const [blob] = await Promise.all([new Response(content, { headers }).blob()]);

        const objectURL = URL.createObjectURL(blob);

        const response = { blob, objectURL, foundRecord }
        recordsCache.set(foundRecord, response);

        return response;
    });
};

export const displayRecord = (record: WarcRecord | string, iframe: HTMLIFrameElement | undefined | null, options?: { records?: WarcRecord[], redirect?: boolean }) => {
    const redirect = options?.redirect ?? true;

    return getRecord(record, { records: options?.records, redirect: redirect }).then(({ objectURL }) => {
        console.log(objectURL);

        if (iframe)
            iframe.src = objectURL;
        else throw new Error("The current iFrame hasnt been set yet!");
    })
        .catch(async err => {
            console.error('Error displaying record:', err);

            const makesafe = (str: string) => str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

            const uri = (typeof record === "string") ? record : record.uri;

            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Page Title</title>
    <style>
        body {
            background-color: red;
            color: black;
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
            margin: 0;
        }
        
        pre {
            width: 75%;
            white-space: pre-wrap; /* Wraps the text */
            word-wrap: break-word; /* Breaks long words */
            overflow: auto; /* Adds scrollbars if necessary */
            background-color: white; /* Optional: to distinguish the pre content */
            padding: 10px; /* Optional: to add some padding */
        }
    </style>
</head>
<body>
    <h1>Error displaying the requested warc record: ${makesafe(decodeURIComponent(uri))}</h1>
    <pre>${makesafe(err.toString())}</pre>
    <a href="#" onclick="window.history.back(); return false;"> Go Back! </a>
</body>
</html>
`;

            const blob = await new Response(html, { headers: { 'Content-Type': "text/html" }, status: 404 }).blob()
            const url = URL.createObjectURL(blob);

            if (iframe)
                iframe.src = url;

            return err;
        });
};