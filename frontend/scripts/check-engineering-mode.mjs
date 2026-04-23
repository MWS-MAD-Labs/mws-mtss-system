import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");
const REPORT_MODE = process.argv.includes("--report") || process.argv.includes("--check");
const CHECK_MODE = process.argv.includes("--check");
const SYNC_OVERRIDES = process.argv.includes("--sync-overrides");

const POLICY = {
    smart_component: 200,
    pure_ui_component: 150,
    custom_hook: 150,
    util_service: 260,
    default: 220
};

const OVERRIDES_PATH = path.join(ROOT_DIR, "scripts", "engineering-size-overrides.json");
const CODE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

const toPosix = (value) => String(value || "").replace(/\\/g, "/");

const relativeFromRoot = (fullPath) => toPosix(path.relative(ROOT_DIR, fullPath));

const readJson = (filePath, fallback) => {
    try {
        const raw = fs.readFileSync(filePath, "utf8");
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const writeJson = (filePath, value) => {
    const content = `${JSON.stringify(value, null, 2)}\n`;
    fs.writeFileSync(filePath, content, "utf8");
};

const collectFiles = (dirPath, bucket = []) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            collectFiles(fullPath, bucket);
            continue;
        }

        if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
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

const detectCategory = (relativePath) => {
    const lowerPath = relativePath.toLowerCase();
    const filename = path.basename(lowerPath);

    if (lowerPath.startsWith("src/hooks/") || /^use[A-Z].*\.(js|jsx|ts|tsx)$/i.test(path.basename(relativePath))) {
        return "custom_hook";
    }

    if (lowerPath.startsWith("src/pages/") || lowerPath.startsWith("src/store/slices/")) {
        return "smart_component";
    }

    if (lowerPath.startsWith("src/components/")) {
        return "pure_ui_component";
    }

    if (lowerPath.startsWith("src/services/") || lowerPath.startsWith("src/utils/")) {
        return "util_service";
    }

    if (filename.includes("slice.")) {
        return "smart_component";
    }

    return "default";
};

const detectContinuousEventRisk = (content) => {
    const hasContinuousEvent =
        /onScroll\s*=|onResize\s*=|onMouseMove\s*=|addEventListener\(\s*['"`](scroll|resize|mousemove|touchmove)/i.test(content);
    const hasRateControl = /throttle|debounce|useThrottledCallback|requestAnimationFrame/i.test(content);
    return hasContinuousEvent && !hasRateControl;
};

if (!fs.existsSync(SRC_DIR)) {
    console.error("src directory not found");
    process.exit(1);
}

const overrides = readJson(OVERRIDES_PATH, {});
const files = collectFiles(SRC_DIR);

const rows = files
    .map((filePath) => {
        const relativePath = relativeFromRoot(filePath);
        const category = detectCategory(relativePath);
        const policyMax = POLICY[category] ?? POLICY.default;
        const overrideMax = Number(overrides[relativePath] || 0);
        const effectiveMax = Math.max(policyMax, overrideMax);
        const lines = countLines(filePath);
        const content = fs.readFileSync(filePath, "utf8");
        const eventRisk = detectContinuousEventRisk(content);

        return {
            filePath,
            relativePath,
            category,
            lines,
            policyMax,
            overrideMax,
            effectiveMax,
            overflow: lines - effectiveMax,
            eventRisk
        };
    })
    .sort((a, b) => b.lines - a.lines);

const violations = rows.filter((row) => row.lines > row.effectiveMax);
const eventRisks = rows.filter((row) => row.eventRisk);
const categoryStats = rows.reduce((acc, row) => {
    if (!acc[row.category]) {
        acc[row.category] = { count: 0, overBudget: 0 };
    }
    acc[row.category].count += 1;
    if (row.lines > row.effectiveMax) {
        acc[row.category].overBudget += 1;
    }
    return acc;
}, {});

if (SYNC_OVERRIDES) {
    const next = {};
    rows.forEach((row) => {
        if (row.lines > row.policyMax) {
            next[row.relativePath] = row.lines;
        }
    });

    writeJson(OVERRIDES_PATH, next);
    console.log(`Synced overrides: ${Object.keys(next).length} file(s) -> ${relativeFromRoot(OVERRIDES_PATH)}`);
    process.exit(0);
}

if (REPORT_MODE) {
    console.log("Engineering Mode Report");
    console.log(`- Files scanned: ${rows.length}`);
    console.log(`- Size budget violations: ${violations.length}`);
    console.log(`- Continuous event risk (no throttle/debounce): ${eventRisks.length}`);

    console.log("\nCategory summary:");
    Object.entries(categoryStats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([name, info]) => {
            const budget = POLICY[name] ?? POLICY.default;
            console.log(`- ${name}: ${info.count} files, ${info.overBudget} over budget, budget=${budget}`);
        });

    if (violations.length > 0) {
        console.log("\nTop size violations:");
        violations
            .sort((a, b) => b.overflow - a.overflow)
            .slice(0, 80)
            .forEach((row) => {
                const overrideLabel = row.overrideMax > 0 ? ` override=${row.overrideMax}` : "";
                console.log(
                    `- +${row.overflow.toString().padStart(4, " ")} lines  ${row.relativePath} (${row.lines}/${row.effectiveMax}) [${row.category}]${overrideLabel}`
                );
            });
    }

    if (eventRisks.length > 0) {
        console.log("\nContinuous event risk files:");
        eventRisks.slice(0, 60).forEach((row) => {
            console.log(`- ${row.relativePath}`);
        });
    }
}

if (CHECK_MODE && violations.length > 0) {
    process.exit(1);
}

if (!REPORT_MODE) {
    console.log(`Engineering check complete. Files scanned: ${rows.length}, violations: ${violations.length}`);
}
