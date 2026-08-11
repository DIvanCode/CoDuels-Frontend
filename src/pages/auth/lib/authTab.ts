export type AuthTab = "login" | "register";

export const resolveAuthTab = (search: string | URLSearchParams): AuthTab => {
    const searchParams = typeof search === "string" ? new URLSearchParams(search) : search;
    return searchParams.get("tab") === "register" ? "register" : "login";
};
