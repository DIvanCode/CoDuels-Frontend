import { setCode } from "features/duel-code-editor/model/code-editor/codeEditorSlice";
import { useRef } from "react";
import { useDispatch } from "react-redux";
import { IconButton } from "shared/ui";
import Loadicon from "shared/assets/icons/loadFile.svg?react";

interface FileLoaderProps {
    acceptedFileTypes?: string;
    className?: string;
}

export const FileLoader = ({
    acceptedFileTypes = ".cpp,.cs,.py,.js,.ts,.java,.txt",
    className = "",
}: FileLoaderProps) => {
    const dispatch = useDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                dispatch(setCode(content));
                console.log("File loaded successfully:", file.name);
            } catch (error) {
                console.error("Error reading file:", error);
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
        <div className={`file-loader ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={acceptedFileTypes}
                style={{ display: "none" }}
            />
            <IconButton
                onClick={handleButtonClick}
                className="file-loader-button"
                title="Load code from file"
            >
                <Loadicon />
            </IconButton>
        </div>
    );
};
