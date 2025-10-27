import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

type Monaco = typeof monaco;

loader.config({
    "paths": {
        vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs",
    },
    "vs/nls": {
        availableLanguages: {
            "*": "ru",
        },
    },
});

const colors = {
    cardPrimary: "#292929",
    comment: "#29992a",
    keyword: "#C586C0",
    string: "#CE9178",
    textPrimary: "#ffffff",
    cardSecondary: "#494949",
};

export const customThemes: Record<string, monaco.editor.IStandaloneThemeData> = {
    dark: {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: colors.comment, fontStyle: "italic" },
            { token: "keyword", foreground: colors.keyword },
            { token: "string", foreground: colors.string },
        ],
        colors: {
            "editor.background": colors.cardPrimary,
            "editor.foreground": colors.textPrimary,
            "editor.lineHighlightBackground": colors.cardSecondary,
        },
    },
};

export const languageConfigs: Record<string, monaco.languages.LanguageConfiguration> = {
    cpp: {
        wordPattern: /(-?\d*\.\d\w*)|([^`~!@#%^&*()\-=+[{\]}|;:'",.<>/?\s]+)/g,

        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: "/*", close: "*/" },
            { open: "<", close: ">" },
        ],

        surroundingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: "<", close: ">" },
            { open: "/*", close: "*/" },
        ],

        indentationRules: {
            increaseIndentPattern:
                /^\s*(if|else|for|while|do|switch|case|struct|class|namespace)\b[^{]*\{\s*$/,
            decreaseIndentPattern: /^\s*\}$/,
        },

        comments: {
            lineComment: "//",
            blockComment: ["/*", "*/"],
        },

        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
            ["<", ">"],
        ],

        autoCloseBefore: ";:.,=}])` \n\t",

        folding: {
            markers: {
                start: /^\s*#pragma region\b/,
                end: /^\s*#pragma endregion\b/,
            },
        },

        onEnterRules: [
            {
                beforeText: /^\s*#\s*(if|ifdef|ifndef|else|elif).*$/,
                action: { indentAction: monaco.languages.IndentAction.Indent },
            },
            {
                beforeText: /^\s*#\s*(endif).*$/,
                action: { indentAction: monaco.languages.IndentAction.Outdent },
            },
        ],
    },

    csharp: {
        wordPattern: /(-?\d*\.\d\w*)|([^`~!@#%^&*()\-=+[{\]}|;:'",.<>/?\s]+)/g,

        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: "`", close: "`" },
            { open: "/*", close: "*/" },
            { open: "<", close: ">" },
            { open: '@"', close: '"' },
        ],

        surroundingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: "`", close: "`" },
            { open: "<", close: ">" },
            { open: '@"', close: '"' },
        ],

        indentationRules: {
            increaseIndentPattern:
                /^\s*(if|else|for|while|do|switch|case|try|catch|finally|using|lock|namespace|class|struct|interface|enum)\b[^{]*\{\s*$|^\s*\{\s*$/,
            decreaseIndentPattern: /^\s*\}$/,
        },

        comments: {
            lineComment: "//",
            blockComment: ["/*", "*/"],
        },

        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
            ["<", ">"],
        ],

        autoCloseBefore: ";:.,=}])` \n\t",

        folding: {
            markers: {
                start: /^\s*#region\b/,
                end: /^\s*#endregion\b/,
            },
        },

        onEnterRules: [
            {
                beforeText: /^\s*#\s*(if|region).*$/,
                action: { indentAction: monaco.languages.IndentAction.Indent },
            },
            {
                beforeText: /^\s*#\s*(endif|endregion).*$/,
                action: { indentAction: monaco.languages.IndentAction.Outdent },
            },
            {
                beforeText: /^\s*\/\/\/\s*$/,
                action: {
                    indentAction: monaco.languages.IndentAction.None,
                    appendText: "/// ",
                },
            },
        ],

        __electricCharacterSupport: {
            docComment: { open: "///", close: "" },
        },
    },
};

export const defaultEditorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    lineHeight: 1.6,

    minimap: {
        enabled: true,
        maxColumn: 80,
    },

    scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
    },

    lineNumbers: "on",
    lineNumbersMinChars: 3,

    selectionHighlight: true,
    renderLineHighlight: "all",
    scrollBeyondLastLine: false,

    wordWrap: "on",
    wordWrapColumn: 80,
    wrappingIndent: "same",

    tabSize: 4,
    insertSpaces: true,
    detectIndentation: true,

    renderWhitespace: "boundary",
    renderControlCharacters: false,
    smoothScrolling: true,
    mouseWheelZoom: true,

    folding: true,
    foldingHighlight: true,
    links: true,
    contextmenu: true,
    formatOnType: true,
    formatOnPaste: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    quickSuggestions: true,

    glyphMargin: true,
    fixedOverflowWidgets: true,
    foldingStrategy: "auto" as const,
    matchBrackets: "always" as const,
    accessibilitySupport: "auto" as const,
};

export const initializeMonaco = (monaco: Monaco) => {
    Object.entries(customThemes).forEach(([themeName, themeData]) => {
        monaco.editor.defineTheme(themeName, themeData);
    });

    Object.entries(languageConfigs).forEach(([language, config]) => {
        monaco.languages.register({ id: language });
        monaco.languages.setLanguageConfiguration(language, config);
    });

    console.log("Monaco Editor initialized");
};

export default {
    loader,
    customThemes,
    languageConfigs,
    defaultEditorOptions,
    initializeMonaco,
};
