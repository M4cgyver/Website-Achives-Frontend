import imageNextJS13OrderedLayout from "@/public/static/images/blogsnextjs13flexandordericon.jpeg"
import { StaticImageData } from "next/image";

export interface Metadata {
    title: string;
    location: string;
    descShort: string;
    descLong: string;
    icon: StaticImageData;
    iconBackground: string;
    published: number;
    edited: number[];
}


export const getBlogListing = async (): Promise<Metadata[]> => [
    {
        title: 'NextJS App Ordered Layout.',
        location: "/blogs/nextjs-flexbox-ordered-layout",
        descShort: 'Lean how to use Next 13+ with flex to intertwine components in the page with the layout.',
        descLong: 'Explore effective strategies for structuring your NextJS App layouts with precision. Learn how to arrange elements seamlessly within page.tsx and layout.tsx. Use styles, flexbox, and flexbox ordering to decupple the components ordering dependence to enhance user experience. ',
        icon: imageNextJS13OrderedLayout,
        iconBackground: 'rgba(214, 183, 157, .7)', 
        published: 1704096000000,
        edited: [1704096000000]
    }
]