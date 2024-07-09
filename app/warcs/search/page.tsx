import Link from "next/link";
import { format } from "date-fns";
import styles from "./page.module.css";

type SearchParams = {
    [key: string]: string | undefined;
};

type ArchivedWebsiteRecord = {
    uri: string;
    status: number;
    location: string | null;
    type: string;
    filename: string;
    offset_header: string;
    offset_content: string;
    content_length: string;
    last_modified: string;
    date: string;
    transfer_encoding: string;
};

type AggregatedInfo = {
    types: Set<string>;
    datesArchived: Set<string>;
};

const getRandomDarkPastelColor = () => {
    // Define ranges for dark pastel colors (adjust as needed)
    const min = 20; // Minimum value for RGB channel
    const max = 50; // Maximum value for RGB channel

    // Generate random values for each RGB channel
    const r = Math.floor(Math.random() * (max - min + 1) + min) + 100;
    const g = Math.floor(Math.random() * (max - min + 1) + min) + 75;
    const b = Math.floor(Math.random() * (max - min + 1) + min) + 25;

    // Construct the color string in hex format
    const color = `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;

    return color;
};

export default async function WarcSearchPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const uri = encodeURIComponent(searchParams.uri ?? "");
    const total = parseInt(searchParams.total ?? "32");
    const page = parseInt(searchParams.page ?? "1");
    const type = searchParams.type ?? "";    

    let response: Response | null = null;
    let latestArchivedWebsites: Array<any> | null = null;

    try {
        response = await fetch(`${process.env.ARCHIVES_INTERNAL_API}/search?uri=${uri}&total=${total}&page=${page}&type=${encodeURIComponent(type)}`, { next: { revalidate: 3600 } });
        if (!response.ok) {
            const responseBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}\n${responseBody}`);
        }
        latestArchivedWebsites = await response.json();
    } catch (error: any) {
        return (
            <div className={styles.error} style={{backgroundColor: getRandomDarkPastelColor()}}>
                Failed to load archived websites. Please try again later.
                <br />
                <pre>{error.message}</pre>
                <pre>{(response && response.ok) ? await response.text() : ''}</pre>
            </div>
        );
    }

    if (!latestArchivedWebsites /*|| !Array.isArray(latestArchivedWebsites.records) */) {
        return (
            <div className={styles.error}>
                Invalid data format received. Please contact support.
            </div>
        );
    }

    // Aggregate data by URI
    const aggregatedArchivedWebsites = latestArchivedWebsites.reduce((acc: { [key: string]: AggregatedInfo }, record: ArchivedWebsiteRecord) => {
        if (!acc[record.uri]) {
            acc[record.uri] = { types: new Set(), datesArchived: new Set() };
        }
        acc[record.uri].types.add(record.type);
        acc[record.uri].datesArchived.add(record.date);

        return acc;
    }, {});

    // Convert sets to arrays for rendering
    const aggregatedList = Object.entries(aggregatedArchivedWebsites).map(([uri, info]: [uri: any, info: any]) => {
        return {
            uri,
            types: Array.from(info.types),
            datesArchived: Array.from(info.datesArchived).sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime()),
        };
    });

    return (
        <div className={styles.results}>
            <ul>
                {aggregatedList.map(({ uri, types, datesArchived }) => (
                    <li key={uri} className={styles.result} style={{backgroundColor: getRandomDarkPastelColor()}}>
                        <b>Url: </b><Link href={`/warcs/viewer?uri=${encodeURIComponent(uri)}`}>{uri}</Link>
                        <ul>
                            <li><b>Type: </b>{types.join(', ')}</li>
                            <li><b>Dates Archived: </b>
                                <ul>
                                    {datesArchived.map((date: any, index) => (
                                        <li key={index}>{format(new Date(date), "MMMM do, yyyy '(Coordinated Universal Time)'")}</li>
                                    ))}
                                </ul>
                            </li>
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
}
