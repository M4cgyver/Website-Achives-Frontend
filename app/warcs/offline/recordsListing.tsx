import React, { useContext, useState } from "react";
import { WarcOfflineContext } from "./context";
import styles from "./recordListing.module.css";
import { WarcRecord } from "./libs";

import winStyles from "@/libs/styles/windows.archives.module.css"

export const RecordsListing = () => {
    const { records, iframeRef, displayRecord } = useContext(WarcOfflineContext);

    const [search, setSearch] = useState("");
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        };
        return date.toLocaleTimeString("en-US", options);
    };

    const recordsToList = records.filter(record => record.content !== null && record.uri.includes(search))
        .sort((a, b) => (a.uri < b.uri ? -1 : 1));

    const handleSearchSubmit = (event: any) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const searchValue = formData.get("search") || "";
        setSearch(searchValue.toString());
    };

    const handleUpdateRecords = () => {
        setLastUpdated(new Date());
    };

    const handleClearRecords = () => {
        console.log("Clearing records...");
    };

    const generateUniqueKey = (record: WarcRecord, index: number) => `${record.uri}-${index}`;

    console.log(records, recordsToList);

    return (
        <div>
            <div className={styles.recordListingController}>
                <form onSubmit={handleSearchSubmit}>
                    <label htmlFor="search">Search: </label>
                    <input type="text" id="search" name="search" />
                    <button type="submit" className={winStyles.button} >Search</button>
                </form>
                <button onClick={handleUpdateRecords} className={winStyles.button} >Update Records</button>
                <button onClick={handleClearRecords} className={winStyles.button} >Clear Records</button>
            </div>

            <div className={styles.recordListing}>

                <div className={styles.singleLineHide}>
                    <h1>Urls</h1>
                    {recordsToList.map((record, index) => (
                        <a href="#"
                            key={generateUniqueKey(record, index)}
                            onClick={() => {
                                if (displayRecord)
                                    displayRecord(record, iframeRef?.current, { records: records })
                            }}>
                            {record.uri}
                        </a>
                    ))}
                </div>
                <div className={styles.singleLine}>
                    <h1>Content-Type</h1>
                    {recordsToList.map((record, index) => (
                        <div key={generateUniqueKey(record, index)}>{record.contentType}</div>
                    ))}
                </div>
                <div className={styles.singleLine}>
                    <h1>Dates</h1>
                    {recordsToList.map((record, index) => (
                        <div key={generateUniqueKey(record, index)}>{formatDate(record.date)}</div>
                    ))}
                </div>
                <div className={styles.singleLine}>
                    <h1>Status</h1>
                    {recordsToList.map((record, index) => (
                        <div key={generateUniqueKey(record, index)}>{record.status}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};
