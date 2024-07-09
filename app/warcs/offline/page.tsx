"use client";

import { FormUpload } from "./formUpload";
import { WarcRecordIframe } from "./iframe";

import { RecordsCounter } from "./recordsCounter";
import { RecordsListing } from "./recordsListing";

import styles from "./page.module.css";
import winStyles from "@/libs/styles/windows.archives.module.css"
import { Metadata } from "next";

export default function WarcOfflinePage() {

    return (<main>
        <div className={`${winStyles.window} ${styles.window}`}>
            <div className={winStyles.title}>
                Local .WARC Viewer
                <RecordsCounter />
            </div>
            <div className={styles.flexthis}>
                <span style={{ backgroundColor: "white", width: "100%", height: "100%" }}>
                    <WarcRecordIframe />
                </span>
            </div>
        </div>

        <div className={`${winStyles.window} ${styles.window} ${styles.upload}`}>
            <div className={winStyles.title}>Upload</div>
            <FormUpload />
        </div>

        <div className={`${winStyles.window} ${styles.window} ${styles.records}`}>
            <div className={winStyles.title}>Records</div>
            <RecordsListing />
        </div>

    </main>
    );
}
