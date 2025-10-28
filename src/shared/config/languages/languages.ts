export const enum LANGUAGES {
    CPP = "cpp",
    CSHARP = "csharp",
    PYTHON = "python",
}

export const LANGUAGE_LABELS = {
    [LANGUAGES.CPP]: "C++",
    [LANGUAGES.CSHARP]: "C#",
    [LANGUAGES.PYTHON]: "Python",
};

export const LANGUAGE_OPTIONS: Array<{
    label: (typeof LANGUAGE_LABELS)[LANGUAGES];
    value: LanguageValue;
}> = [
    { label: LANGUAGE_LABELS[LANGUAGES.CPP], value: LANGUAGES.CPP },
    { label: LANGUAGE_LABELS[LANGUAGES.CSHARP], value: LANGUAGES.CSHARP },
    { label: LANGUAGE_LABELS[LANGUAGES.PYTHON], value: LANGUAGES.PYTHON },
];

export type LanguageValue = LANGUAGES;
