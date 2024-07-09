import { fontEagleSpCGA_Alt2x2, fontToshibaTxL2 } from "@/libs/fonts";

import styles from "./page.module.css"
import winStyles from "@/libs/styles/windows.archives.module.css"
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'M4cgyver Online Archives',
    description: 'I have some archives of stuff (websites, software, torrents, etc.) that I have downloaded over the years and I wanted to share. Feel free to check anything out!',

    creator: 'M4cgyver',
    publisher: 'M4cgyver',

    referrer: 'origin-when-cross-origin',

    openGraph: {
        title: 'M4cgyvers Repurposed Mining Rig! ',
        description: 'Welcome to my (M4cgyver) website / resume (depending on whos reading). Written in NextJS 13 and NodeJs all within a Docker container!',
        url: 'https://archives.m4cgyver.com',
        locale: 'en-US',
        type: 'website',

    }
};

export default async function ArchivesPage({
}: {
    }) {
    const fetchLatestContentArchived = await fetch(`${process.env.ARCHIVES_INTERNAL_API}/search?by=latest&total=16&status=200&type=text/html`, { next: { revalidate: 3600 } });
    const fetchStatistics = await fetch(`${process.env.ARCHIVES_INTERNAL_API}/statistics`, { next: { revalidate: 3600 } });

    const fetchLatestContentArchivedJSON = fetchLatestContentArchived.ok ? await fetchLatestContentArchived.json() : null;
    const fetchStatisticsJSON = fetchStatistics.ok ? await fetchStatistics.json() : null;

    return <main>
        <div className={`${styles.intro} ${fontToshibaTxL2.variable} ${fontEagleSpCGA_Alt2x2.variable}`}>
            <h1>M4cgyvers Online Archives</h1>
            <h2>I have some archives of stuff (websites, software, torrents, etc.) that I have downloaded over the years and I wanted to share. Feel free to check anything out!</h2>
        </div>

        <div className={`${styles.spacer}`}></div>

        <div className={`${styles.warcInfo}`}>
            <div className={`${winStyles.window}`}>
                <div className={`${winStyles.title}`}>.WARC Backup Latest</div>
                {fetchLatestContentArchived.ok ? (
                    <>
                        <div style={{ textAlign: 'center' }}>Here are the latest web-content I have downloaded, list updated every 5 minutes.</div>

                        <div style={{ height: 16 }} />

                        <div className={styles.warcUris} style={{ display: "flex", width: "100%", padding: 4 }}>
                            {/* URI Column */}
                            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                                <b style={{ width: "100%", textAlign: "center" }}>URI</b>
                                {fetchLatestContentArchivedJSON.map((entry: any, index: number) => (
                                    <Link href={`/warcs/viewer?uri=${encodeURIComponent(entry.uri)}`} prefetch={false} key={index} style={{ width: "100%", overflow: "hidden", textWrap: "nowrap", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                        {entry.uri}
                                    </Link>
                                ))}
                            </div>


                            {/* Date Column */}
                            <div style={{ display: "flex", flexDirection: "column", padding: 0 }}>
                                <b style={{ width: "100%", textAlign: "center" }}>Date</b>
                                {fetchLatestContentArchivedJSON.map((entry: any, index: number) => (
                                    <span key={index} style={{ textWrap: "nowrap", whiteSpace: "nowrap" }}>
                                        {new Date(entry.date).toLocaleDateString('en-US', {
                                            month: '2-digit',
                                            day: '2-digit',
                                            year: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                ) : null}

            </div>

            <div className={`${winStyles.window}`}>
                <div className={`${winStyles.title}`}>.WARC Backup Statistics</div>
                <div style={{ textAlign: 'center' }}>Simple debug statistics on how much content I have backed up / free space.</div>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", height: "60%", textAlign: "center" }}>
                    <div><b>Used Space:</b> {(parseFloat(fetchStatisticsJSON.used) / (1024 * 1024)).toFixed(2)} MB</div>
                    <div><b>Free Space:</b> {(parseFloat(fetchStatisticsJSON.free) / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
            </div>

            <div className={`${winStyles.window} ${styles.offline}`}>
                <div className={`${winStyles.title}`}>.WARC Offline Viewer</div>
                <Link href="/warcs/offline" style={{ textAlign: "center" }}>
                    <div style={{ padding: "3%" }}>
                        <h3>You can also <u>click here </u> to view .warc files you have! No file uploads, no 3rd libs, all locally in the browser.</h3>
                        <br />
                        <h4><em>JavaScript Required!</em></h4>
                    </div>
                </Link>
            </div>
        </div>
    </main>;
}