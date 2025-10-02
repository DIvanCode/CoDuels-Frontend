import { setLanguage } from "features/duel-code-editor/model/language-selector/languagesSelectorSlice";
import {
    selectAvailableLanguages,
    selectLanguageValue,
} from "features/duel-code-editor/model/language-selector/selectors";
import { useDispatch, useSelector } from "react-redux";
import { Select } from "shared/ui";

export const LanguageSelector = () => {
    const dispatch = useDispatch();

    const currentLanguage = useSelector(selectLanguageValue);
    const availableLanguages = useSelector(selectAvailableLanguages);

    const handleLanguageChange = (languageValue: string) => {
        dispatch(setLanguage(languageValue));
    };

    if (!availableLanguages) {
        return <div>Loading languages...</div>;
    }

    return (
        <Select
            value={currentLanguage || ""}
            options={availableLanguages || []}
            onChange={handleLanguageChange}
        />
    );
};
