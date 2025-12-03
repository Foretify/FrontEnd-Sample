// Compare Page Module
class ComparePage {
    constructor() {
        this.pageId = 'compare';
        this.resultsData = {};
        this.currentDocument = '';
        this.availableFiles = [];
    }

    async init() {
        await this.loadAvailableDocuments();
        this.setupDocumentSelector();
    }

    async loadAvailableDocuments() {
        // Get list of JSON files from results folder via API
        try {
            const response = await fetch('/api/results');
            const data = await response.json();
            
            if (data.files) {
                this.availableFiles = data.files;
                console.log('Available JSON files:', this.availableFiles);
            } else {
                console.error('No files returned from API');
                this.availableFiles = [];
            }
        } catch (error) {
            console.error('Error loading file list:', error);
            this.availableFiles = [];
        }
    }

    async loadDocument(filename) {
        try {
            const response = await fetch(`results/${filename}`);
            const data = await response.json();
            this.resultsData[filename] = data;
            console.log(`Loaded ${filename}:`, data);
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            this.resultsData[filename] = null;
        }
    }

    setupDocumentSelector() {
        const selector = document.getElementById('documentSelector');
        console.log('Setting up document selector:', selector);
        
        if (selector) {
            // Clear existing options except the first placeholder
            selector.innerHTML = '<option value="">Select a document...</option>';
            
            // Add options for each JSON file
            this.availableFiles.forEach(filename => {
                const option = document.createElement('option');
                option.value = filename;
                // Display name without .json extension
                option.textContent = filename.replace('.json', '');
                selector.appendChild(option);
            });
            
            selector.addEventListener('change', async (e) => {
                this.currentDocument = e.target.value;
                console.log('Document selected:', this.currentDocument);
                
                if (this.currentDocument) {
                    // Load the document if not already loaded
                    if (!this.resultsData[this.currentDocument]) {
                        await this.loadDocument(this.currentDocument);
                    }
                    this.displayResults();
                } else {
                    document.getElementById('resultsContainer').innerHTML = '<p class="no-results">Please select a document to view results.</p>';
                }
            });
        }
    }

    displayResults() {
        const container = document.getElementById('resultsContainer');
        console.log('Display results - container:', container);
        console.log('Current document:', this.currentDocument);
        console.log('All results data:', this.resultsData);
        
        if (!container) {
            console.error('Results container not found!');
            return;
        }

        const data = this.resultsData[this.currentDocument];
        console.log('Selected document data:', data);

        if (!data || !data.json_preview || !data.json_preview.Verification) {
            console.log('No data or verification found');
            container.innerHTML = `<p class="no-results">No results available for this document.</p>`;
            return;
        }

        let html = '<div class="results-header">';
        html += `<h3>Document: ${data.document_name || 'N/A'}</h3>`;
        html += `<p class="batch-info">Batch ID: ${data.batch_id || 'N/A'} | Status: ${data.status || 'N/A'} | Request Time: ${data.request_time || 'N/A'}</p>`;
        html += '</div>';

        // Display all verification sections with their tables
        data.json_preview.Verification.forEach((verification, index) => {
            if (verification.value) {
                html += this.renderVerificationTable(verification, index);
            }
        });

        container.innerHTML = html;
    }

    renderVerificationTable(verification, index) {
        const value = verification.value;
        
        let html = '<div class="verification-section">';
        html += `<div class="verification-header">`;
        html += `<h4>${verification.metadataLabel || verification.metadataName || 'Verification Result'}</h4>`;
        html += `<span class="verification-status ${verification.VerificationResult?.toLowerCase()}">${verification.VerificationResult || 'N/A'}</span>`;
        html += `</div>`;

        if (verification.VerificationDescription) {
            html += `<p class="verification-description">${verification.VerificationDescription}</p>`;
        }

        if (value.tableTitle) {
            html += `<h5 class="table-title">${value.tableTitle}</h5>`;
        }

        html += '<div class="table-wrapper">';
        html += '<table class="results-table">';
        
        // Table headers
        if (value.headers && value.headers.length > 0) {
            html += '<thead><tr>';
            value.headers.forEach(header => {
                html += `<th>${header}</th>`;
            });
            html += '</tr></thead>';
        }

        // Table rows
        if (value.rows && value.rows.length > 0) {
            html += '<tbody>';
            value.rows.forEach(row => {
                html += '<tr>';
                if (value.headers) {
                    value.headers.forEach(header => {
                        html += `<td>${row[header] !== undefined ? row[header] : ''}</td>`;
                    });
                } else {
                    // If no headers, display all row values
                    Object.values(row).forEach(cellValue => {
                        html += `<td>${cellValue !== undefined ? cellValue : ''}</td>`;
                    });
                }
                html += '</tr>';
            });
            html += '</tbody>';
        } else {
            html += '<tbody><tr><td colspan="100%" class="no-data">No data available</td></tr></tbody>';
        }

        html += '</table>';
        html += '</div>'; // table-wrapper
        
        // Display footnotes if available
        if (value.footnotes && value.footnotes.length > 0) {
            html += '<div class="table-footnotes">';
            value.footnotes.forEach((footnote, idx) => {
                html += `<p class="footnote">${footnote}</p>`;
            });
            html += '</div>';
        }
        
        html += '</div>'; // verification-section

        return html;
    }

    onPageShow() {
        // Reload file list when page becomes active
        this.loadAvailableDocuments().then(() => {
            this.setupDocumentSelector();
            if (this.currentDocument && this.resultsData[this.currentDocument]) {
                this.displayResults();
            }
        });
    }

    onPageHide() {
        // Called when page becomes inactive
    }
}
