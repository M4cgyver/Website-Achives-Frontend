export function formatDateToMMMMDDYYYY(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDate: string = date.toLocaleDateString('en-US', options);

    // Add ordinal suffix to the day
    const day: number = date.getDate();
    let daySuffix: string = 'th';
    if (day === 1 || day === 21 || day === 31) {
        daySuffix = 'st';
    } else if (day === 2 || day === 22) {
        daySuffix = 'nd';
    } else if (day === 3 || day === 23) {
        daySuffix = 'rd';
    }

    // Replace day with suffix in the formatted date
    const formattedDateWithSuffix: string = formattedDate.replace(/\d{1,2}(?=\b)/, day + daySuffix);

    return formattedDateWithSuffix;
}
