import { LanguageLabel, LanguageOptions, LanguageValue } from "./languages";

export interface LanguageSelectorState {
    value: LanguageValue;
    availableLanguages: LanguageOptions;
}

export interface LanguageOption {
    label: LanguageLabel;
    value: LanguageValue;
}
