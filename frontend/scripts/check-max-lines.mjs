import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");
const MAX_LINES = Number(process.env.MAX_FILE_LINES || 200);
const CODE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const REPORT_MODE = process.argv.includes("--report");

const collectFiles = (dirPath, bucket = []) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            collectFiles(fullPath, bucket);
            continue;
        }

        const ext = path.extname(entry.name);
        if (CODE_EXTENSIONS.has(ext)) {
            bucket.push(fullPath);
        }
    }

    return bucket;
};

const countLines = (filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    if (!content) return 0;
    return content.split(/\r?\n/).length;
};

const formatRelative = (filePath) => path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

if (!fs.existsSync(SRC_DIR)) {
    console.error("src directory not found");
    process.exit(1);
}

const files = collectFiles(SRC_DIR);
const rows = files
    .map((filePath) => ({ filePath, lines: countLines(filePath) }))
    .sort((a, b) => b.lines - a.lines);

const violations = rows.filter((row) => row.lines > MAX_LINES);

if (REPORT_MODE) {
    console.log(`Checked ${rows.length} code files under src`);
    console.log(`Max lines policy: ${MAX_LINES}`);
    console.log(`Violations: ${violations.length}`);

    if (violations.length) {
        console.log("\nTop violations:");
        for (const row of violations.slice(0, 100)) {
            console.log(`${String(row.lines).padStart(4, " ")}  ${formatRelative(row.filePath)}`);
        }
    }
}

if (violations.length) {
    if (!REPORT_MODE) {
        console.error(`Found ${violations.length} files above ${MAX_LINES} lines:`);
        for (const row of violations) {
            console.error(` - ${formatRelative(row.filePath)} (${row.lines})`);
        }
        process.exit(1);
    }
    process.exit(0);
}

if (!REPORT_MODE) {
    console.log(`All good. ${rows.length} files are <= ${MAX_LINES} lines.`);
}
