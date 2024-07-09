"use client";

import { ReactNode } from "react";
import { SearchForm } from "./search";
import { useSearchParams } from "next/navigation";

import styles from "./layout.module.css" 

export default function WarcSearchLayout({
    children,
}: {
    children: ReactNode
}) {
    const searchParams = useSearchParams()
    const searchUri = searchParams.get("uri") ?? "";
    const searchPage = parseInt(searchParams.get('page') ?? '1');
    const searchTotal = parseInt(searchParams.get('total') ?? '32');

    return <main style={{ width: "75%", margin: "0 auto" }}>
        <SearchForm
            uri={searchUri}
            page={searchPage}
            total={searchTotal}
            totalVisible={true}
            pageVisible={true}
            style={undefined}
        />

        {children}

    </main>
}