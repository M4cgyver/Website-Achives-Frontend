export interface WARCRecord {
  "warc-record-id": string;
  "warc-date": Date;
  "warc-type":
    | "warcinfo"
    | "response"
    | "resource"
    | "request"
    | "metadata"
    | "revisit"
    | "conversion"
    | "continuation"
    | string;
  "content-offset": BigInt;
  "content-length": BigInt;
  "content-type"?: string;
  "warc-concurrent-to"?: string;
  "warc-block-digest"?: string;
  "warc-payload-digest"?: string;
  "warc-ip-address"?: string;
  "warc-refers-to"?: string;
  "warc-target-uri"?: string;
  "warc-truncated"?: "length" | "time" | "disconnect" | "unspecified" | string;
  "warc-warcinfo-id"?: string;
  "warc-filename"?: string;
  "warc-profile"?: string;
  "warc-identified-payload-type"?: string;
  "warc-segment-number"?: number;
  "warc-segment-origin-id"?: string;
  "warc-segment-total-length"?: number;
}

export interface HttpResponseRecord {
  "content-type": string;
  status: number;

  "content-length"?: BigInt;
  "content-offset"?: BigInt;
  "cache-control"?: string;
  "content-disposition"?: string;
  "content-encoding"?: string;
  "content-language"?: string;
  date?: Date;
  eTag?: string;
  expires?: string;
  "last-modified"?: Date;
  location?: string;
  server?: string;
  "set-cookie"?: string;
  "strict-transport-security"?: string;
  vary?: string;
  "www-authenticate"?: string;
}

export interface BlobRecord {
  "content-length"?: BigInt;
  "content-offset"?: BigInt;
}

export const parseWarcHeader = (headerBuffer: String) => {
  // Split header into lines and extract key-value pairs
  const headerAny: { [key: string]: string } = {};
  const headerLines = headerBuffer.split("\r\n");
  headerLines.forEach((line, index) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex !== -1) {
      const key = line.substring(0, separatorIndex).trim().toLowerCase();
      const value = line.substring(separatorIndex + 1).trim();
      headerAny[key] = value;
    }
  });

  return headerAny;
};

export class WarcExplorer {
  
  constructor() {}

  async parse(
    readFile: (buffer: Buffer, start: number, end: number) => Promise<Buffer>,
    options?: {
      file?: any;
      callback?: (options?: {
        file?: any;
        headerWarc?: WARCRecord;
        headerResponse?: HttpResponseRecord;
        blobRecord?: BlobRecord
      }) => any;
    }
  ) {
    // Example usage of the read function
    const buffer = Buffer.alloc(1024); // Allocate a buffer
    let position = 0; // Current position

    // Call the provided read function
    for (let i = 0; ; i++)
      try {
        await readFile(buffer, position, position + buffer.length).then(
          async (buffer) => {
            const chunks = buffer.toString().split("\r\n\r\n");
            const headerAny = parseWarcHeader(chunks[0]);

            // Convert to an actual record
            const headerWarc: WARCRecord = {
              // Mandatory keys
              "warc-record-id": headerAny["warc-record-id"],
              "warc-date": new Date(headerAny["warc-date"]),
              "warc-type": headerAny["warc-type"],
              "content-offset": BigInt(position),
              "content-length": BigInt(headerAny["content-length"]),

              // Optional keys
              "content-type": headerAny["content-type"],
              "warc-concurrent-to": headerAny["warc-concurrent-to"],
              "warc-block-digest": headerAny["warc-block-digest"],
              "warc-payload-digest": headerAny["warc-payload-digest"],
              "warc-ip-address": headerAny["warc-ip-address"],
              "warc-refers-to": headerAny["warc-refers-to"],
              "warc-target-uri": headerAny["warc-target-uri"],
              "warc-truncated": headerAny["warc-truncated"],
              "warc-warcinfo-id": headerAny["warc-warcinfo-id"],
              "warc-filename": headerAny["warc-filename"],
              "warc-profile": headerAny["warc-profile"],
              "warc-identified-payload-type":
                headerAny["warc-identified-payload-type"],
              "warc-segment-number": headerAny["warc-segment-number"]
                ? parseInt(headerAny["warc-segment-number"])
                : undefined,
              "warc-segment-origin-id": headerAny["warc-segment-origin-id"],
              "warc-segment-total-length": headerAny["warc-segment-number"]
                ? parseInt(headerAny["warc-segment-total-length"])
                : undefined,
            };

            let httpResponseRecord: HttpResponseRecord | undefined = undefined;
            let blobRecord: BlobRecord | undefined = undefined;

            if (headerWarc["warc-type"] == "response") {
              await readFile(
                buffer,
                position + chunks[0].length + 4,
                position + chunks[0].length + 4 + buffer.length
              ).then((buffer) => {
                const chunks2 = buffer.toString().split("\r\n\r\n");
                const httpResponseAny = parseWarcHeader(chunks2[0]);

                httpResponseRecord = {
                  // Mandatory fields
                  "content-type": httpResponseAny["content-type"],
                  "content-offset": BigInt(position + chunks2[0].length + 4),
                  status: parseInt(chunks2[0].slice(0, 16).split(" ")[1]),

                  // Optional fields
                  "content-length": httpResponseAny["content-length"]
                    ? BigInt(httpResponseAny["content-length"])
                    : undefined,
                  "cache-control": httpResponseAny["cache-control"],
                  "content-disposition": httpResponseAny["content-disposition"],
                  "content-encoding": httpResponseAny["content-encoding"],
                  "content-language": httpResponseAny["content-language"],
                  date: httpResponseAny["date"]
                    ? new Date(httpResponseAny["date"])
                    : undefined,
                  eTag: httpResponseAny["eTag"],
                  expires: httpResponseAny["expires"],
                  "last-modified": httpResponseAny["last-modified"]
                    ? new Date(httpResponseAny["last-modified"])
                    : undefined,
                  location: httpResponseAny["location"],
                  server: httpResponseAny["server"],
                  "set-cookie": httpResponseAny["set-cookie"],
                  "strict-transport-security":
                    httpResponseAny["strict-transport-security"],
                  vary: httpResponseAny["vary"],
                  "www-authenticate": httpResponseAny["www-authenticate"],
                };

                blobRecord = {
                  'content-length': BigInt(Number(headerWarc['content-length']) - Number(chunks2[0].length) - Number(4)), //TODO: NOT OPTIMIAL FOR BIGINT
                  'content-offset': BigInt(position) + BigInt(chunks[0].length) + BigInt(4) + BigInt(chunks2[0].length) + BigInt(4),
                };

              });
            }

            if (options && options.callback)
              options.callback({
                file: options?.file,
                headerWarc: headerWarc,
                headerResponse: httpResponseRecord,
                blobRecord: blobRecord,
              });

            position += chunks[0].length + 8 + parseInt(headerAny["content-length"]);

            //console.log(position, headerWarc["warc-target-uri"]);
          }
        );
      } catch (err: any) {
        console.warn(err.message);
        break;
      }
  }
}