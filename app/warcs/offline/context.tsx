"use client";

import { Dispatch, MutableRefObject, SetStateAction, createContext, useContext, useState, useRef } from 'react';
import { WarcRecord } from './libs';

interface WarcOfflineContextType {
    files: File[];
    records: WarcRecord[];
    iframeRef: MutableRefObject<HTMLIFrameElement | null> | null;

    parseFiles: ((files: File[], records: WarcRecord[]) => Promise<void[] | undefined>) | null;

    getRecord: ((record: WarcRecord | string, options?: {
        records?: WarcRecord[];
        redirect?: boolean;
        referenced?: string[];
    }) => Promise<{
        blob: Blob;
        objectURL: string;
        record: string | WarcRecord;
    }>) | null;

    displayRecord:  ((record: WarcRecord | string, iframe: HTMLIFrameElement | undefined | null, options?: {
        records?: WarcRecord[];
        redirect?: boolean;
    }) => Promise<void>) | null;
}

const defaultContext: WarcOfflineContextType = {
    files: [],
    records: [],
    iframeRef: null,

    parseFiles: null,
    getRecord: null, 
    displayRecord: null,
};

export const WarcOfflineContext = createContext<WarcOfflineContextType>(defaultContext);
