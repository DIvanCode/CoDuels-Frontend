export interface CodeEditorState {
    code: string;
    theme: "dark" | "light";
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
    isLoaded: boolean;
}

export interface EditorConfig {
    theme: string;
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
}
