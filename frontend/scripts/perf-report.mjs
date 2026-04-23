import fs from "fs";
import path from "path";
import zlib from "zlib";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const ASSETS = path.join(DIST, "assets");
const CHECK_MODE = process.argv.includes("--check");
const MAX_CHUNK_GZIP_KB = Number(process.env.PERF_MAX_CHUNK_GZIP_KB || 180);
const MAX_TOTAL_JS_GZIP_KB = Number(process.env.PERF_MAX_TOTAL_JS_GZIP_KB || 900);

const toKb = (value) => Math.round((value / 1024) * 100) / 100;
const gzipSize = (value) => zlib.gzipSync(value).length;

if (!fs.existsSync(ASSETS)) {
    console.error("dist/assets not found. Run `npm run build` first.");
    process.exit(1);
}

const files = fs
    .readdirSync(ASSETS)
    .filter((name) => name.endsWith(".js") || name.endsWith(".css"))
    .map((name) => {
        const fullPath = path.join(ASSETS, name);
        const content = fs.readFileSync(fullPath);
        const raw = content.length;
        const gzip = gzipSize(content);
        return {
            name,
            ext: path.extname(name).slice(1),
            raw,
            gzip
        };
    })
    .sort((a, b) => b.gzip - a.gzip);

const jsFiles = files.filter((file) => file.ext === "js");
const cssFiles = files.filter((file) => file.ext === "css");
const totalJsRaw = jsFiles.reduce((sum, file) => sum + file.raw, 0);
const totalJsGzip = jsFiles.reduce((sum, file) => sum + file.gzip, 0);

console.log("Bundle Performance Report");
console.log(`- JS chunks: ${jsFiles.length}`);
console.log(`- CSS chunks: ${cssFiles.length}`);
console.log(`- Total JS raw: ${toKb(totalJsRaw)} KB`);
console.log(`- Total JS gzip: ${toKb(totalJsGzip)} KB`);
console.log(`- Budget total JS gzip: ${MAX_TOTAL_JS_GZIP_KB} KB`);

console.log("\nTop JS chunks by gzip:");
jsFiles.slice(0, 12).forEach((file) => {
    console.log(`- ${file.name}: ${toKb(file.gzip)} KB gzip (${toKb(file.raw)} KB raw)`);
});

console.log("\nTop CSS chunks by gzip:");
cssFiles.slice(0, 6).forEach((file) => {
    console.log(`- ${file.name}: ${toKb(file.gzip)} KB gzip (${toKb(file.raw)} KB raw)`);
});

const chunkViolations = jsFiles.filter((file) => toKb(file.gzip) > MAX_CHUNK_GZIP_KB);
const totalViolation = toKb(totalJsGzip) > MAX_TOTAL_JS_GZIP_KB;

if (chunkViolations.length > 0) {
    console.log("\nChunk budget warnings:");
    chunkViolations.forEach((file) => {
        console.log(`- ${file.name} exceeds ${MAX_CHUNK_GZIP_KB} KB gzip (${toKb(file.gzip)} KB)`);
    });
}

if (totalViolation) {
    console.log(`\nTotal JS gzip exceeds budget (${toKb(totalJsGzip)} KB > ${MAX_TOTAL_JS_GZIP_KB} KB).`);
}

if (CHECK_MODE && (chunkViolations.length > 0 || totalViolation)) {
    process.exit(1);
}
