// TODO: Make all these strings localizable
export function getTimeString(utcSeconds) {
    const date = new Date(0);
    date.setUTCSeconds(parseInt(utcSeconds));

    const mins = Math.floor((Date.now() - date) / 6e4);
    if (mins < 1) {
        return 'just now';
    }

    if (mins < 60) {
        return mins === 1 ?
            `${mins} minute ago`
            : `${mins} minutes ago`;
    }

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
        return hrs === 1 ?
            `${hrs} hour ago`
            : `${hrs} hours ago`;
    }

    const days = Math.floor(hrs / 24);
    if (days < 20) {
        return days === 1 ?
            `${days} day ago`
            : `${days} days ago`;
    }

    return `on ${date.toDateString()}`;
}
