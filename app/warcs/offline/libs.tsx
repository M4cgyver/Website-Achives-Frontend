"use client";

import { useContext } from "react";
import { WarcOfflineContext } from "./context";
import { mWarcParse } from "./mwarc";

export interface WarcRecord {
    date: Date;
    ip: string;
    uri: string;
    size: bigint | null;
    status: number;
    contentType: string | null;
    location: string | undefined | null;
    content: (() => Promise<Buffer | ReadableStream>) | undefined | null;
}