import { useRef } from "react";
import { IconButton } from "shared/ui";
import LoadIcon from "shared/assets/icons/load-file.svg?react";

import styles from "./FileLoader.module.scss";

interface Props {
    onFileLoaded: (content: string, fileName: string) => void;
    acceptedFileTypes?: string;
}

export const FileLoader = ({
    onFileLoaded,
    acceptedFileTypes = ".cpp,.cs,.py,.js,.ts,.java,.txt",
}: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                onFileLoaded(content, file.name);
            } catch (error) {
                alert("Error reading file. Please try another file.");
            }
        };

        reader.onerror = () => {
            console.error("Error reading file");
            alert("Error reading file. Please try again.");
        };

        reader.readAsText(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={acceptedFileTypes}
                style={{ display: "none" }}
            />
            <IconButton
                onClick={handleButtonClick}
                size="small"
                className={styles.trigger}
                title="Load code from file"
            >
                <LoadIcon />
            </IconButton>
        </div>
    );
};
