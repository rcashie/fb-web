let fetchedUrls = {};
export function dynamicImport(url) {
    if (fetchedUrls[url]) {
        return;
    }

    fetchedUrls[url] = true;
    let script = document.createElement('script');
    script.setAttribute('src', url);
    script.setAttribute('type', 'module');
    document.getElementsByTagName('head')[0].appendChild(script);
}
