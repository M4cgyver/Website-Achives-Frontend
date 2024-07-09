"use client";

import { useContext, useEffect } from "react";
import { WarcOfflineContext } from "./context";
import { hookOnMessageEventListener } from "./actions";

export const WarcRecordIframe = () => {
    const { iframeRef, records } = useContext(WarcOfflineContext);

    useEffect(
        () =>hookOnMessageEventListener({ iframe: iframeRef?.current, records: records }), 
        [iframeRef?.current]
    );

    return <iframe ref={iframeRef} style={{ width: "100%", aspectRatio: 1920 / 1080, resize: 'vertical' }} />;
}