export const enum LANGUAGES {
    CPP = "cpp",
    GO = "go",
    PYTHON = "python",
}

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

export type LanguageValue = LANGUAGES;
