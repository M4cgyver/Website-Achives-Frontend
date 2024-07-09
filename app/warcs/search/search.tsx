"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { CSSProperties, HTMLAttributes } from "react";

// List of MIME types
const mimeTypes = [
    "application/atom+xml; charset=UTF-8",
    "application/gzip",
    "application/java-archive",
    "application/ld+json",
    "application/msword",
    "application/octet-stream",
    "application/octet-stream; charset=utf-8",
    "application/pdf",
    "application/pkcs8",
    "application/rss+xml; charset=UTF-8",
    "application/vnd.amazon.ebook",
    "application/vnd.apple.installer+xml",
    "application/vnd.ms-excel",
    "application/vnd.ms-fontobject",
    "application/vnd.oasis.opendocument.presentation",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.visio",
    "application/xml",
    "application/x-bzip",
    "application/x-bzip2",
    "application/x-freearc",
    "application/x-font-truetype",
    "application/x-httpd-php",
    "application/x-sh",
    "application/x-tar",
    "application/x-7z-compressed",
    "application/zip",
    "audio/aac",
    "audio/midi",
    "audio/mpeg",
    "audio/ogg",
    "audio/opus",
    "audio/wav",
    "audio/webm",
    "audio/x-midi",
    "audio/3gpp",
    "audio/3gpp2",
    "font/otf",
    "font/ttf",
    "font/woff",
    "font/woff2",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/png; charset=utf-8",
    "image/svg+xml",
    "image/tiff",
    "image/vnd.microsoft.icon",
    "image/webp",
    "model/3mf",
    "model/vrml",
    "text/calendar",
    "text/css",
    "text/csv",
    "text/html",
    "text/javascript",
    "text/plain",
    "text/xml",
    "video/mp2t",
    "video/mp4",
    "video/ogg",
    "video/webm",
    "video/x-msvideo",
    "video/3gpp",
    "video/3gpp2"
];


export const SearchForm = ({
    uri,
    page = 1,
    total = 32,
    pageVisible = true, 
    totalVisible = true, 
    style = {}        
}: {
    uri: string;
    page: number | undefined;
    total: number | undefined;
    pageVisible: boolean | undefined;
    totalVisible: boolean | undefined;
    style: CSSProperties | undefined;
}) => {
    const isTotalVisible = totalVisible ?? true;    // Set to true if undefined
    const isPageVisible = pageVisible ?? true;      // Set to true if undefined

    const router = useRouter();

    const handleSearchFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default form submission
        const form = e.currentTarget;
        const formData = new FormData(form);
        const uriValue = formData.get('uri') as string;
        const pageValue = formData.get('page') as string;
        const totalValue = formData.get('total') as string;
        const typeValue = formData.get('type') as string;

        // Construct the URL for navigation with query parameters
        const query = `uri=${encodeURIComponent(uriValue)}&page=${encodeURIComponent(pageValue)}&total=${encodeURIComponent(totalValue)}&type=${encodeURIComponent(typeValue)}`;
        router.push(`/warcs/search?${query}`);
    }

    return (
        <form style={style} className={styles.search} onSubmit={handleSearchFormSubmit}>
            <label htmlFor="uri">Search:</label>
            <input
                type="text"
                id="uri"
                name="uri"
                placeholder="URI"
                defaultValue={decodeURI(uri)}
            />

            <span className={styles.spacer} />
            
            <label htmlFor="type">Type:</label>
            <select id="type" name="type">
                <option value="">Select Type</option>
                {mimeTypes.map((type) => (
                    <option key={type} value={type}>
                        {type}
                    </option>
                ))}
            </select>

            <span className={styles.spacer} />
            
            <label style={{ display: isPageVisible ? "block" : "none" }} htmlFor="page">Page:</label>
            <input style={{ display: isPageVisible ? "block" : "none" }}
                type="number"
                id="page"
                name="page"
                min="1"
                defaultValue={page ?? 1}
            />

            <span className={styles.spacer} />

            <label style={{ display: isTotalVisible ? "block" : "none" }} htmlFor="total">Total:</label>
            <input style={{ display: isTotalVisible ? "block" : "none" }}
                type="number"
                id="total"
                name="total"
                min="1"
                defaultValue={total ?? 32}
            />

            <span className={styles.spacer} />

            <button type="submit">Search</button>
        </form>
    );
}
