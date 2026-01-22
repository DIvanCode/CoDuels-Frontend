export const enum LANGUAGES {
    CPP = "cpp",
    GO = "go",
    PYTHON = "python",
}

export type LanguageValue = LANGUAGES;

export type ApiLanguageValue = "Python" | "Cpp" | "Golang";

const API_LANGUAGE_MAP: Record<LanguageValue, ApiLanguageValue> = {
    [LANGUAGES.CPP]: "Cpp",
    [LANGUAGES.GO]: "Golang",
    [LANGUAGES.PYTHON]: "Python",
};

export const LANGUAGE_LABELS = {
    [LANGUAGES.CPP]: "C++",
    [LANGUAGES.GO]: "Go",
    [LANGUAGES.PYTHON]: "Python",
};

export const LANGUAGE_OPTIONS: Array<{
    label: (typeof LANGUAGE_LABELS)[LANGUAGES];
    value: LanguageValue;
}> = [
    { label: LANGUAGE_LABELS[LANGUAGES.CPP], value: LANGUAGES.CPP },
    { label: LANGUAGE_LABELS[LANGUAGES.GO], value: LANGUAGES.GO },
    { label: LANGUAGE_LABELS[LANGUAGES.PYTHON], value: LANGUAGES.PYTHON },
];

export const toApiLanguage = (language: LanguageValue): ApiLanguageValue =>
    API_LANGUAGE_MAP[language];

export const fromApiLanguage = (language?: string | null): LanguageValue => {
    const normalized = (language ?? "").toLowerCase().trim();

    if (normalized === "cpp" || normalized === "c++") {
        return LANGUAGES.CPP;
    }

    if (normalized === "golang" || normalized === "go") {
        return LANGUAGES.GO;
    }

    if (normalized === "python") {
        return LANGUAGES.PYTHON;
    }

    return LANGUAGES.CPP;
};
