const encoder = new TextEncoder();

const xmlEscape = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

const stripDocxText = (value = "") =>
    String(value)
        .replace(/\s+/g, " ")
        .trim();

const buildRun = (text = "", { bold = false, size = 22, color = "1f2937" } = {}) => `
    <w:r>
        <w:rPr>
            ${bold ? "<w:b/>" : ""}
            <w:color w:val="${color}"/>
            <w:sz w:val="${size}"/>
            <w:szCs w:val="${size}"/>
        </w:rPr>
        <w:t xml:space="preserve">${xmlEscape(stripDocxText(text))}</w:t>
    </w:r>`;

const buildParagraph = (text = "", options = {}) => {
    const { align = "left", spacingAfter = 160 } = options;
    return `
        <w:p>
            <w:pPr>
                <w:jc w:val="${align}"/>
                <w:spacing w:after="${spacingAfter}"/>
            </w:pPr>
            ${buildRun(text, options)}
        </w:p>`;
};

const buildBullets = (items = []) =>
    items
        .map((item) => buildParagraph(`- ${item}`, { size: 21, spacingAfter: 80 }))
        .join("");

const buildCell = (value = "", { header = false } = {}) => `
    <w:tc>
        <w:tcPr>
            <w:tcW w:w="2400" w:type="dxa"/>
            ${header ? '<w:shd w:fill="E0F2FE"/>' : ""}
            <w:tcMar>
                <w:top w:w="80" w:type="dxa"/>
                <w:left w:w="80" w:type="dxa"/>
                <w:bottom w:w="80" w:type="dxa"/>
                <w:right w:w="80" w:type="dxa"/>
            </w:tcMar>
        </w:tcPr>
        ${buildParagraph(value, { bold: header, size: header ? 20 : 18, spacingAfter: 0 })}
    </w:tc>`;

const buildTable = (headers = [], rows = []) => `
    <w:tbl>
        <w:tblPr>
            <w:tblW w:w="0" w:type="auto"/>
            <w:tblBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            </w:tblBorders>
        </w:tblPr>
        <w:tr>${headers.map((header) => buildCell(header, { header: true })).join("")}</w:tr>
        ${rows.map((row) => `<w:tr>${row.map((cell) => buildCell(cell)).join("")}</w:tr>`).join("")}
    </w:tbl>
    ${buildParagraph("", { spacingAfter: 200 })}`;

const buildDocumentXml = (report) => {
    const highPriorityIssues = report.issues.filter((issue) => issue.priority === "High");

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        ${buildParagraph(report.title, { bold: true, size: 36, color: "0f172a", spacingAfter: 80 })}
        ${buildParagraph(`Report date: ${report.reportDate}`, { size: 22, color: "475569" })}
        ${buildParagraph(`Source page: ${report.sourcePage}`, { size: 22, color: "475569", spacingAfter: 220 })}
        ${buildParagraph("Executive Summary", { bold: true, size: 28, color: "0f172a" })}
        ${buildParagraph(report.executiveSummary, { size: 22 })}
        ${buildTable(
            ["Metric", "Value", "Detail"],
            report.stats.map((stat) => [stat.label, stat.value, stat.detail]),
        )}
        ${buildParagraph("Document Quality Check", { bold: true, size: 28, color: "0f172a" })}
        ${buildTable(
            ["Criterion", "Status", "Evidence"],
            report.qualityChecks.map((entry) => [entry.criterion, entry.status, entry.evidence]),
        )}
        ${buildParagraph("Main Findings", { bold: true, size: 28, color: "0f172a" })}
        ${buildTable(
            ["Finding", "Stakeholder Meaning", "Required Decision"],
            report.mainFindings.map((entry) => [entry.finding, entry.meaning, entry.decision]),
        )}
        ${buildParagraph("High Priority Issues", { bold: true, size: 28, color: "0f172a" })}
        ${buildTable(
            ["Issue", "Impact", "Action", "Effort"],
            highPriorityIssues.map((entry) => [entry.issue, entry.impact, entry.action, entry.effort]),
        )}
        ${buildParagraph("Full Action Plan", { bold: true, size: 28, color: "0f172a" })}
        ${buildTable(
            ["Issue", "Impact", "Priority", "Action", "Effort"],
            report.issues.map((entry) => [entry.issue, entry.impact, entry.priority, entry.action, entry.effort]),
        )}
        ${buildParagraph("Recommended Delivery Order", { bold: true, size: 28, color: "0f172a" })}
        ${buildTable(
            ["Order", "Work Item", "Exit Criteria"],
            report.deliveryOrder.map((entry) => [entry.order, entry.workItem, entry.exitCriteria]),
        )}
        ${buildParagraph("Rollout Gates", { bold: true, size: 28, color: "0f172a" })}
        ${buildTable(
            ["Gate", "Pass Condition"],
            report.rolloutGates.map((entry) => [entry.gate, entry.passCondition]),
        )}
        ${buildParagraph("Data Notes", { bold: true, size: 28, color: "0f172a" })}
        ${buildTable(
            ["Principal", "Unit", "Step Completion", "Bug Reports", "Final Feedback", "Readiness"],
            report.dataNotes.map((entry) => [
                entry.principal,
                entry.unit,
                entry.stepCompletion,
                entry.bugReports,
                entry.finalFeedbackState,
                entry.finalReadiness,
            ]),
        )}
        ${buildParagraph("Data Handling", { bold: true, size: 28, color: "0f172a" })}
        ${buildBullets(report.dataHandling)}
        <w:sectPr>
            <w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>
            <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
        </w:sectPr>
    </w:body>
</w:document>`;
};

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const rootRelationshipsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const emptyDocumentRelationshipsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
        let c = i;
        for (let k = 0; k < 8; k += 1) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c >>> 0;
    }
    return table;
})();

const crc32 = (bytes) => {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
        crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (view, offset, value) => view.setUint16(offset, value, true);
const writeUint32 = (view, offset, value) => view.setUint32(offset, value >>> 0, true);

const concatBytes = (chunks) => {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    chunks.forEach((chunk) => {
        output.set(chunk, offset);
        offset += chunk.length;
    });
    return output;
};

const createZipBlob = (files) => {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach(({ path, content }) => {
        const nameBytes = encoder.encode(path);
        const dataBytes = typeof content === "string" ? encoder.encode(content) : content;
        const checksum = crc32(dataBytes);

        const localHeader = new Uint8Array(30);
        const localView = new DataView(localHeader.buffer);
        writeUint32(localView, 0, 0x04034b50);
        writeUint16(localView, 4, 20);
        writeUint16(localView, 6, 0);
        writeUint16(localView, 8, 0);
        writeUint16(localView, 10, 0);
        writeUint16(localView, 12, 0);
        writeUint32(localView, 14, checksum);
        writeUint32(localView, 18, dataBytes.length);
        writeUint32(localView, 22, dataBytes.length);
        writeUint16(localView, 26, nameBytes.length);
        writeUint16(localView, 28, 0);

        localParts.push(localHeader, nameBytes, dataBytes);

        const centralHeader = new Uint8Array(46);
        const centralView = new DataView(centralHeader.buffer);
        writeUint32(centralView, 0, 0x02014b50);
        writeUint16(centralView, 4, 20);
        writeUint16(centralView, 6, 20);
        writeUint16(centralView, 8, 0);
        writeUint16(centralView, 10, 0);
        writeUint16(centralView, 12, 0);
        writeUint16(centralView, 14, 0);
        writeUint32(centralView, 16, checksum);
        writeUint32(centralView, 20, dataBytes.length);
        writeUint32(centralView, 24, dataBytes.length);
        writeUint16(centralView, 28, nameBytes.length);
        writeUint16(centralView, 30, 0);
        writeUint16(centralView, 32, 0);
        writeUint16(centralView, 34, 0);
        writeUint16(centralView, 36, 0);
        writeUint32(centralView, 38, 0);
        writeUint32(centralView, 42, offset);
        centralParts.push(centralHeader, nameBytes);

        offset += localHeader.length + nameBytes.length + dataBytes.length;
    });

    const centralDirectory = concatBytes(centralParts);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    writeUint32(endView, 0, 0x06054b50);
    writeUint16(endView, 4, 0);
    writeUint16(endView, 6, 0);
    writeUint16(endView, 8, files.length);
    writeUint16(endView, 10, files.length);
    writeUint32(endView, 12, centralDirectory.length);
    writeUint32(endView, 16, offset);
    writeUint16(endView, 20, 0);

    return new Blob([concatBytes([...localParts, centralDirectory, endRecord])], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
};

export const createReportDocxBlob = (report) =>
    createZipBlob([
        { path: "[Content_Types].xml", content: contentTypesXml },
        { path: "_rels/.rels", content: rootRelationshipsXml },
        { path: "word/_rels/document.xml.rels", content: emptyDocumentRelationshipsXml },
        { path: "word/document.xml", content: buildDocumentXml(report) },
    ]);

export const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * AI-16: Audit-logged DOCX download.
 * actor: { id, name, role } — pass from auth state at the call site.
 */
export const downloadBlobWithAudit = (blob, filename, report, actor = {}) => {
    downloadBlob(blob, filename);

    const entry = {
        event: "docx_download",
        filename,
        reportTitle: report?.title || filename,
        sourcePage: report?.sourcePage || window.location.pathname,
        actorId: actor.id || actor._id || null,
        actorName: actor.name || null,
        actorRole: actor.role || null,
        timestamp: new Date().toISOString(),
    };

    console.info("[AuditLog] DOCX download", entry);

    try {
        const payload = JSON.stringify(entry);
        const sent = typeof navigator.sendBeacon === "function"
            && navigator.sendBeacon("/api/v1/audit/events", new Blob([payload], { type: "application/json" }));
        if (!sent) {
            fetch("/api/v1/audit/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
                keepalive: true,
            }).catch((_) => { /* fire-and-forget */ });
        }
    } catch (_) { /* export error is non-fatal */ }
};
