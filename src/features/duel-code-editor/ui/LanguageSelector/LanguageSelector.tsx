import { useEffect, useState } from "react";
import { Select } from "shared/ui";
import {
    LANGUAGE_OPTIONS,
    LANGUAGES,
    LanguageValue,
} from "../../model/language-selector/languages";

interface LanguageSelectorProps {
    value?: LanguageValue;
    onChange?: (value: LanguageValue) => void;
}

export const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageValue>(value || LANGUAGES.CPP);

    useEffect(() => {
        if (value !== undefined) {
            setSelectedLanguage(value);
        }
    }, [value]);

    const currentLanguage = value !== undefined ? value : selectedLanguage;

    const handleLanguageChange = (languageValue: string) => {
        const newValue = languageValue as LanguageValue;

        if (value === undefined) {
            setSelectedLanguage(newValue);
        }

        onChange?.(newValue);
    };

    return (
        <Select
            value={currentLanguage}
            options={LANGUAGE_OPTIONS}
            onChange={handleLanguageChange}
        />
    );
};
