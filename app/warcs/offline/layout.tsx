"use client";

import { ReactNode, useRef } from "react";
import { SearchForm } from "../search/search";
import { WarcOfflineContext } from "./context";
import { WarcRecord } from "./libs";
import { mWarcParse, mWarcParseResponseContent, mWarcParseResponses } from "./mwarc";
import { parseFiles, getRecord, displayRecord, hookOnMessageEventListener} from "./actions"
import { Metadata } from "next";

export default function WarcOfflineLayout({
    children,
}: {
    children: ReactNode
}) {
    const files: File[] = [];
    const records: WarcRecord[] = [];
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    return <WarcOfflineContext.Provider value={{ files, records, iframeRef, parseFiles, getRecord, displayRecord }}>
        {children}
    </WarcOfflineContext.Provider>
}