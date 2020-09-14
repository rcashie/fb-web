function getCookieParams() {
    let paramMap = {};
    const cookie = document.cookie;
    if (cookie) {
        const cookieRegex = /^\s*([^=]+)=(.+)$/;
        cookie.split(';').forEach(param => {
            const matches = param.match(cookieRegex);
            if (matches && matches[1] && matches[2]) {
                paramMap[matches[1]] = matches[2];
            }
        });
    }

    return paramMap;
}

function getUserClaims() {
    const params = getCookieParams();
    const token = params['token'];
    return token ? JSON.parse(atob(token.split('.')[1])) : null;
}

export { getUserClaims };
