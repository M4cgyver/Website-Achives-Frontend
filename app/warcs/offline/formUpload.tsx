"use client";

import { useContext, useRef } from "react";
import { WarcOfflineContext } from "./context";

import winStyles from "@/libs/styles/windows.archives.module.css"

export const FormUpload = () => {
    const refFormInput = useRef<HTMLInputElement>(null);
    const { files, records, parseFiles } = useContext(WarcOfflineContext);

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (refFormInput.current && refFormInput.current.files) {
            const uploadedFiles = Array.from(refFormInput.current.files as FileList);
            
            if(uploadedFiles && files && parseFiles) {
                //files.current = uploadedFiles;
                while(files.length > 0 ) files.pop();
                uploadedFiles.forEach(file => files.push(file));
                parseFiles(files, records);
            } 
        }
    };

    return (
        <form onSubmit={handleFormSubmit}>
            <label htmlFor="file-upload">Upload WARC files:</label>
            <input
                id="file-upload"
                type="file"
                accept=".warc"
                ref={refFormInput}
                multiple
            />
            <button type="submit" className={winStyles.button}>Submit Files</button>
        </form>
    );
}