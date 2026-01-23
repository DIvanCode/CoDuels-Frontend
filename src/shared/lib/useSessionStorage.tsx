import { useEffect, useState, Dispatch, SetStateAction } from "react";

export function useSessionStorage<T>(
    key: string,
    initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        try {
            const item = sessionStorage.getItem(key);
            return item !== null ? (JSON.parse(item) as T) : initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch {
            // no-op
        }
    }, [key, value]);

    return [value, setValue];
}
