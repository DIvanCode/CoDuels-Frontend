export const LANGUAGES = {
    CPP: "cpp",
    CSHARP: "csharp",
    PYTHON: "python",
};

export const LANGUAGE_TO_LABELS = {
    [LANGUAGES.CPP]: "C++",
    [LANGUAGES.CSHARP]: "C#",
    [LANGUAGES.PYTHON]: "Python",
};

export type LanguageValue = (typeof LANGUAGES)[keyof typeof LANGUAGES];
export type LanguageLabel = (typeof LANGUAGE_TO_LABELS)[keyof typeof LANGUAGES];

export const LANGUAGE_OPTIONS: Array<{ label: LanguageLabel; value: LanguageValue }> =
    Object.entries(LANGUAGES).map(([_, value]) => ({
        label: LANGUAGE_TO_LABELS[value],
        value,
    }));

console.log(LANGUAGE_OPTIONS);

export type LanguageOptions = typeof LANGUAGE_OPTIONS;
