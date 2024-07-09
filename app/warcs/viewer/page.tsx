import Link from "next/link";
import styles from "./page.module.css"

export default function WarcViewerPage({
    searchParams,
  }: {
    searchParams: { [key: string]: string | undefined };
  }) {
    const uri = searchParams.uri ?? ''; // Get the 'uri' parameter from searchParams
    const apiViewUri = `${process.env.ARCHIVES_EXTERNAL_API}/view?uri=${uri}&redirect=true`;

    return (
      <main >
        <div className={styles.content}>
          <div className={styles.title} title={`Api URL: ${apiViewUri}`}>Viewing <Link href={uri} target="_blank">{uri}</Link></div>
          <span style={{backgroundColor: "white", width:"100%", height:"100%"}}>
          <iframe style={{width:"100%", aspectRatio:1920/1080, resize:'vertical'}} src={apiViewUri}/>
          </span>
        </div>
      </main>
    );
  }
