export const buildUserConnectUrl = (apiBaseUrl: string, origin: string, ticket: string) => {
    const apiBase = new URL(apiBaseUrl, origin);
    const basePath = apiBase.pathname.replace(/\/$/, "");

    apiBase.pathname = `${basePath}/users/connect`;
    apiBase.search = "";
    apiBase.searchParams.set("ticket", ticket);

    if (apiBase.protocol === "https:" || apiBase.protocol === "wss:") {
        apiBase.protocol = "wss:";
    } else if (apiBase.protocol === "http:" || apiBase.protocol === "ws:") {
        apiBase.protocol = "ws:";
    } else {
        throw new Error(`Unsupported API protocol: ${apiBase.protocol}`);
    }

    return apiBase.toString();
};
