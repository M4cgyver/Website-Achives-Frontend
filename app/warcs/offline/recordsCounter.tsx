import { useContext, useEffect, useRef } from "react"
import { WarcOfflineContext } from "./context";

const RecordsCounterText = (length: number) => `${length ?? 0} Records`;

export const RecordsCounter = () => {
    const { records } = useContext(WarcOfflineContext);

    const ref = useRef<HTMLPreElement>(null); // Specify the type of useRef

    useEffect(() => {
        const interval = setInterval(() => {
            if (ref.current) {
                ref.current.textContent = RecordsCounterText(records.length ?? 0);
            }
        }, 24);
        //return () => clearInterval(interval); // Clean up the interval on unmount

    }, []); // Empty dependency array to run effect only once on mount


    return <span ref={ref} style={{ float: "right" }}> {RecordsCounterText(records.length ?? 0)} </span>
}