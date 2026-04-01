// compare-page.js

// 
// ---- CONFIG ----
const TOKEN_RESULTS_PATH = "/results/token_results/request-tokens.json";

class ComparePage {
    getConfidenceScore(value) {
        if (!value || value === "") return 50;
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            hash += value.charCodeAt(i);
        }
        return 65 + (hash % 35); // Returns 65-100
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    constructor() {
        this.pageId = "compare";

        // Raw tokens from request-tokens.json
        this.tokens = [];

        // Current selections
        this.selectedMaterial = "";
        this.selectedDocType = "";
        this.selectedVersion = "";
        this.interactiveVerifications = new InteractiveVerifications(this);

        // Cache of loaded result JSONs (keyed by result_path URL)
        this.resultsData = {};

        // DOM refs
        this.materialSelect = null;
        this.docTypeSelect = null;
        this.versionSelect = null;
        this.loadButton = null;

        


    }
    

    async init() {
        await this.loadTokens();
        this.setupSelectors();
        this.populateMaterialOptions();

        const container = document.getElementById("resultsContainer");
        if (container) {
            container.innerHTML =
                '<p class="no-results">Please select Material, Document Type, and Version.</p>';
        }
    }

    // ------------- DATA LOADING -------------

    async loadTokens() {
        try {
            console.log("Loading request tokens from:", TOKEN_RESULTS_PATH);
            const resp = await fetch(TOKEN_RESULTS_PATH);

            if (!resp.ok) {
                console.warn("Could not load request-tokens.json:", resp.status);
                this.tokens = [];
                return;
            }

            const data = await resp.json();
            console.log("Raw request-tokens data:", data);

            // Your file is a plain array
            if (Array.isArray(data)) {
                this.tokens = data;
            } else if (data && Array.isArray(data.requests)) {
                this.tokens = data.requests;
            } else {
                console.warn("request-tokens.json format not recognized, using empty list.");
                this.tokens = [];
            }

            console.log("Loaded tokens:", this.tokens);
        } catch (err) {
            console.error("Error loading request-tokens.json:", err);
            this.tokens = [];
        }
    }

    async loadResultByPath(resultPath) {
        if (!resultPath) {
            console.error("No resultPath provided to loadResultByPath");
            return null;
        }

        // result_path in JSON is like "results/<token>.json"
        const url = `/${resultPath.replace(/^\/?/, "")}`; // ensure it starts with "/"

        if (this.resultsData[url]) {
            return this.resultsData[url];
        }

        try {
            console.log("Fetching result JSON from:", url);
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Error loading ${url}: HTTP ${response.status}`);
                this.resultsData[url] = null;
                return null;
            }
            const data = await response.json();
            this.resultsData[url] = data;
            console.log(`Loaded result JSON from ${url}:`, data);
            return data;
        } catch (error) {
            console.error(`Error loading ${url}:`, error);
            this.resultsData[url] = null;
            return null;
        }
    }

    // ------------- SELECTORS / FILTERING -------------

    setupSelectors() {
        this.materialSelect = document.getElementById("compareMaterialSelect");
        this.docTypeSelect = document.getElementById("compareDocTypeSelect");
        this.versionSelect = document.getElementById("compareVersionSelect");
        this.loadButton = document.getElementById("compareLoadButton"); // optional

        if (!this.materialSelect || !this.docTypeSelect || !this.versionSelect) {
            console.error(
                "One or more compare selectors not found. Expected IDs: compareMaterialSelect, compareDocTypeSelect, compareVersionSelect"
            );
            return;
        }

        this.materialSelect.innerHTML = "";
        this.docTypeSelect.innerHTML = "";
        this.versionSelect.innerHTML = "";

        this.materialSelect.addEventListener("change", () => {
            this.selectedMaterial = this.materialSelect.value || "";
            this.selectedDocType = "";
            this.selectedVersion = "";
            this.populateDocTypeOptions();
            this.populateVersionOptions();
            this.clearResults();
        });

        this.docTypeSelect.addEventListener("change", () => {
            this.selectedDocType = this.docTypeSelect.value || "";
            this.selectedVersion = "";
            this.populateVersionOptions();
            this.clearResults();
        });

        this.versionSelect.addEventListener("change", () => {
            this.selectedVersion = this.versionSelect.value || "";
            this.clearResults();
        });

        if (this.loadButton) {
            this.loadButton.addEventListener("click", () =>
                this.loadAndDisplaySelectedResult()
            );
        } else {
            // Auto-load when all three are selected
            [this.materialSelect, this.docTypeSelect, this.versionSelect].forEach(
                (sel) => {
                    sel.addEventListener("change", () => {
                        if (
                            this.selectedMaterial &&
                            this.selectedDocType &&
                            this.selectedVersion
                        ) {
                            this.loadAndDisplaySelectedResult();
                        }
                    });
                }
            );
        }
    }

    populateMaterialOptions() {
        if (!this.materialSelect) return;

        const materials = new Set();
        this.tokens.forEach((t) => {
            const status = (t.Status || t.status || "").toUpperCase();
            if (status !== "COMPLETED") return;
            const mat = t.material_id || "";
            if (mat) materials.add(mat);
        });

        this.materialSelect.innerHTML =
            '<option value="">Select Material...</option>';
        Array.from(materials)
            .sort()
            .forEach((mat) => {
                const option = document.createElement("option");
                option.value = mat;
                option.textContent = mat;
                this.materialSelect.appendChild(option);
            });

        this.populateDocTypeOptions();
        this.populateVersionOptions();
    }

    populateDocTypeOptions() {
        if (!this.docTypeSelect) return;

        this.docTypeSelect.innerHTML =
            '<option value="">Select Document Type...</option>';
        if (!this.selectedMaterial) return;

        const docTypes = new Set();
        this.tokens.forEach((t) => {
            const status = (t.Status || t.status || "").toUpperCase();
            if (status !== "COMPLETED") return;

            const mat = t.material_id || "";
            if (mat !== this.selectedMaterial) return;

            const dt = t.document_type || "";
            if (dt) docTypes.add(dt);
        });

        Array.from(docTypes)
            .sort()
            .forEach((dt) => {
                const option = document.createElement("option");
                option.value = dt;
                option.textContent = dt;
                this.docTypeSelect.appendChild(option);
            });
    }

    populateVersionOptions() {
        if (!this.versionSelect) return;

        this.versionSelect.innerHTML =
            '<option value="">Select Version...</option>';
        if (!this.selectedMaterial || !this.selectedDocType) return;

        const versions = new Set();
        this.tokens.forEach((t) => {
            const status = (t.Status || t.status || "").toUpperCase();
            if (status !== "COMPLETED") return;

            const mat = t.material_id || "";
            const dt = t.document_type || "";
            if (mat !== this.selectedMaterial || dt !== this.selectedDocType) return;

            const v = t.version || "";
            if (v) versions.add(v);
        });

        Array.from(versions)
            .sort()
            .forEach((v) => {
                const option = document.createElement("option");
                option.value = v;
                option.textContent = v;
                this.versionSelect.appendChild(option);
            });
    }

    findSelectedToken() {
        if (
            !this.selectedMaterial ||
            !this.selectedDocType ||
            !this.selectedVersion
        ) {
            return null;
        }

        const candidates = this.tokens.filter((t) => {
            const status = (t.Status || t.status || "").toUpperCase();
            if (status !== "COMPLETED") return false;

            const mat = t.material_id || "";
            const dt = t.document_type || "";
            const v = t.version || "";

            return (
                mat === this.selectedMaterial &&
                dt === this.selectedDocType &&
                v === this.selectedVersion
            );
        });

        if (candidates.length === 0) return null;
        // If multiple (like your 2 CCSS tokens), pick the last (latest)
        return candidates[candidates.length - 1];
    }

    // ------------- DISPLAY -------------

    clearResults() {
        const container = document.getElementById("resultsContainer");
        if (!container) return;
        container.innerHTML =
            '<p class="no-results">Please select Material, Document Type, and Version.</p>';
    }

    async loadAndDisplaySelectedResult() {
        const container = document.getElementById("resultsContainer");
        if (!container) return;

        const token = this.findSelectedToken();
        if (!token) {
            container.innerHTML =
                '<p class="no-results">No COMPLETED result found for the selected combination.</p>';
            return;
        }

        const resultPath = token.result_path;
        if (!resultPath) {
            container.innerHTML =
                '<p class="no-results">No result path found in request-tokens.json for the selected token.</p>';
            return;
        }

        const data = await this.loadResultByPath(resultPath);
        if (!data) {
            container.innerHTML = `<p class="no-results">Failed to load result JSON from: ${resultPath}</p>`;
            return;
        }

        this.displayResults(data, token, resultPath);
    }

    buildHeaderHtml(data, token, resultPath) {
        const docName =
            data.document_name ||
            (data.meta && data.meta.document_path) ||
            token.document_name ||
            token.token_id ||
            resultPath;

        const status =
            data.status || data.Status || (data.ok ? "SUCCESS" : "N/A");
        const requestTime =
            data.request_time ||
            data.token_generation_time ||
            token.token_generation_time ||
            token.batch_id ||
            "N/A";

        let html = '<div class="results-header">';
        // html += `<h3>Document: ${docName}</h3>`;
        html += `<p class="batch-info">Status: ${status} | Request/Batch: ${requestTime}</p>`;
        html += `<p class="batch-info">Material: ${this.selectedMaterial} | Doc Type: ${this.selectedDocType} | Version: ${this.selectedVersion}</p>`;
        html += "</div>";
        return html;
    }

    displayResults(data, token, resultPath) {
        const container = document.getElementById("resultsContainer");
        if (!container) {
            console.error("Results container not found!");
            return;
        }

        const verifications =
            (data.json_preview && data.json_preview.Verification) ||
            data.Verification ||
            [];

        if (!Array.isArray(verifications) || verifications.length === 0) {
            container.innerHTML =
                `<p class="no-results">No Verification results in this file.</p>`;
            return;
        }

        let html = this.buildHeaderHtml(data, token, resultPath);

        verifications.forEach((verification, index) => {
            html += this.renderVerificationSection(verification, index);
        });

        container.innerHTML = html;

        //attach interactive verification listeners
        if (this.interactiveVerifications && this.interactiveVerifications.attachCellClickListeners){
            this.interactiveVerifications.attachCellClickListeners()
        }
    }

    renderVerificationSection(verification, index) {
        const renditionType = (verification.renditionType || "").toUpperCase();
        const label =
            verification.metadataLabel ||
            verification.metadataName ||
            `Verification #${index + 1}`;

        const result =
            verification.extractionResult ||
            verification.VerificationResult ||
            verification.verificationResult ||
            "N/A";

        const description =
            verification.extractionDescription ||
            verification.VerificationDescription ||
            verification.verificationDescription ||
            "";

        const value = verification.value;

        let html = '<div class="verification-section">';
        html += `<div class="verification-header">`;
        html += `<h4>${label}</h4>`;
        html += `<span class="verification-status ${String(
            result
        ).toLowerCase()}">${result}</span>`;
        html += `</div>`;

        if (description) {
            html += `<p class="verification-description">${description}</p>`;
        }

        // If NOT_COMPLIANT or simple string → show as paragraph
        if (
            result === "NOT_COMPLIANT" ||
            typeof value === "string" ||
            (!value && !Array.isArray(value))
        ) {
            const text =
                value && typeof value === "string" && value.trim()
                    ? value
                    : "No structured data available for this check.";
            html += `<div class="paragraph-result"><p>${text}</p></div>`;
            html += "</div>";
            return html;
        }

        // Structured/table/flow → render table(s)
        html += this.renderTableFromValue(value, renditionType, label);
        html += "</div>";
        return html;
    }

    renderTableFromValue(value, renditionType, label) {
        // If value is an array, render each table object separately
        if (Array.isArray(value)) {
            return value
                .map((tableObj, idx) => {
                    const tableLabel =
                        tableObj.tableTitle ||
                        (label
                            ? `${label} — Table ${idx + 1}`
                            : `Table ${idx + 1}`);
                    return this.renderSingleTableObject(tableObj, tableLabel);
                })
                .join("");
        }

        // Single object
        return this.renderSingleTableObject(value, label);
    }

    // Handles one { tableTitle, headers, rows, footnotes } object
    renderSingleTableObject(value, label) {
        if (!value || typeof value !== "object") {
            return '<p class="no-results">No data available</p>';
        }

        let tableTitle = value.tableTitle || value.title || "";
        let headers = [];
        let rows = [];
        let footnotes = Array.isArray(value.footnotes) ? value.footnotes : [];

        // Case 1: CCSS/DPFD style: headers + rows (objects)
        if (Array.isArray(value.headers) && Array.isArray(value.rows)) {
            headers = value.headers;
            rows = value.rows.map((rowObj) =>
                headers.map((h) =>
                    rowObj && rowObj[h] !== undefined && rowObj[h] !== null
                        ? rowObj[h]
                        : ""
                )
            );
        }
        // Case 2: value.table is array-of-arrays with {value}
        else if (Array.isArray(value.table)) {
            const tableRows = value.table;
            if (tableRows.length > 0 && Array.isArray(tableRows[0])) {
                const firstRow = tableRows[0];
                headers = firstRow.map((cell) =>
                    cell && cell.value !== undefined ? cell.value : ""
                );
                for (let i = 1; i < tableRows.length; i++) {
                    const row = tableRows[i];
                    if (!Array.isArray(row)) continue;
                    const rowValues = row.map((cell) =>
                        cell && cell.value !== undefined ? cell.value : ""
                    );
                    rows.push(rowValues);
                }
            }
        }
        // Case 3: FLOW-style (manufacturing steps)
        else if (Array.isArray(value.steps)) {
            tableTitle = tableTitle || `${label} — Steps`;
            headers = [
                "Step Number",
                "Name",
                "Inputs",
                "Outputs",
                "Description",
                "In-Process Controls",
            ];
            rows = value.steps.map((step) => [
                step.stepNumber ?? "",
                step.name ?? "",
                Array.isArray(step.inputs) ? step.inputs.join(", ") : "",
                Array.isArray(step.outputs) ? step.outputs.join(", ") : "",
                step.description ?? "",
                Array.isArray(step.inProcessControls)
                    ? step.inProcessControls.join(", ")
                    : "",
            ]);
        } else {
            return '<p class="no-results">No tabular data available</p>';
        }

        if (!headers.length || !rows.length) {
            return '<p class="no-results">No data available</p>';
        }

        let html = "";

        if (tableTitle) {
            html += `<h5 class="table-title">${tableTitle}</h5>`;
        }

        html += '<div class="table-wrapper">';
        html += '<table class="results-table">';

        // Headers
        html += "<thead><tr>";
        headers.forEach((h) => {
            html += `<th>${h}</th>`;
        });
        html += "</tr></thead>";

        // Rows
        html += "<tbody>";
        rows.forEach((row, rowIdx) => {
            html += "<tr>";
            row.forEach((cell, colIdx) => {
                const cellValue = cell !== undefined && cell !== null ? cell : "";
                const confidence = this.getConfidenceScore(String(cellValue));
                const cellId = `cell-${Date.now()}-${rowIdx}-${colIdx}-${Math.random().toString(36).substr(2, 9)}`;
                
                html += `<td class="clickable-cell" 
                    data-cell-id="${cellId}"
                    data-row="${rowIdx}"
                    data-col="${colIdx}"
                    data-header="${headers[colIdx] || ''}"
                    data-value="${this.escapeHtml(String(cellValue))}"
                    data-confidence="${confidence}">${cellValue}</td>`;
            });
            html += "</tr>";
        });
        html += "</tbody>";

        html += "</table>";
        html += "</div>";

        // Footnotes
        if (footnotes && footnotes.length > 0) {
            html += '<div class="table-footnotes">';
            footnotes.forEach((fn) => {
                if (typeof fn === "string") {
                    html += `<p class="footnote">${fn}</p>`;
                } else if (fn && (fn.text || fn.marker)) {
                    const marker = fn.marker ? `${fn.marker} ` : "";
                    html += `<p class="footnote">${marker}${
                        fn.text || ""
                    }</p>`;
                }
            });
            html += "</div>";
        }

        return html;
    }

    // ------------- PAGE LIFECYCLE -------------

    async onPageShow() {
        await this.loadTokens();
        this.populateMaterialOptions();
        this.clearResults();
    }

    onPageHide() {
        // No-op
    }
}