import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(repoRoot, "public");

const monacoSource = resolve(repoRoot, "node_modules/monaco-editor/min/vs");
const monacoTarget = resolve(publicDir, "monaco/vs");

rmSync(resolve(publicDir, "monaco"), { recursive: true, force: true });
mkdirSync(dirname(monacoTarget), { recursive: true });
cpSync(monacoSource, monacoTarget, { recursive: true });

const interRevision = "353b61b9f4430d5f420d56605a6e7993e0941470";
const interBaseUrl = `https://raw.githubusercontent.com/rsms/inter/${interRevision}`;

const remoteAssets = [
    {
        url: `${interBaseUrl}/docs/font-files/InterVariable.woff2`,
        target: resolve(publicDir, "fonts/InterVariable.woff2"),
    },
    {
        url: `${interBaseUrl}/docs/font-files/InterVariable-Italic.woff2`,
        target: resolve(publicDir, "fonts/InterVariable-Italic.woff2"),
    },
    {
        url: `${interBaseUrl}/LICENSE.txt`,
        target: resolve(publicDir, "licenses/inter/LICENSE.txt"),
    },
];

const downloadIfMissing = async ({ url, target }) => {
    if (existsSync(target)) return;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download runtime asset ${url}: ${response.status}`);
    }

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(await response.arrayBuffer()));
};

await Promise.all(remoteAssets.map(downloadIfMissing));
