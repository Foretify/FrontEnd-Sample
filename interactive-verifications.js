/**
 * Interactive Verifications Module
 * 
 * Purpose: Handles all interactive verification functionality for table cells in the Compare Results page
 * 
 * Features:
 * - Makes table cells clickable for user verification
 * - Displays verification panel with confidence scores
 * - Allows users to confirm or correct cell values
 * - Stores verification results
 * 
 * How it works:
 * 1. attachCellClickListeners() - Adds click handlers to all clickable cells
 * 2. handleCellClick() - Manages cell selection state
 * 3. showVerificationPanel() - Creates and displays the verification UI
 * 4. saveVerification() - Stores user verification decisions
 * 
 * Integration:
 * - Instantiated by ComparePage class
 * - Called after table rendering is complete
 * - Stores verifications in memory for the session
 * - Sends feedback to collect_feedback.js for quality tracking
 */

class InteractiveVerifications {
    constructor(comparePage) {
        this.comparePage = comparePage;
        this.selectedCell = null;
        this.verifications = {}; // Store user verifications
    }

    attachCellClickListeners() {
        const cells = document.querySelectorAll('.clickable-cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                this.handleCellClick(e.target);
            });
        });
    }

    handleCellClick(cell) {
        // Remove previous selection
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected-cell');
        }

        // Mark new selection
        cell.classList.add('selected-cell');
        this.selectedCell = cell;

        // Show verification panel
        this.showVerificationPanel(cell);
    }

    showVerificationPanel(cell) {
        const cellId = cell.dataset.cellId;
        const value = cell.dataset.value;
        const confidence = parseFloat(cell.dataset.confidence);
        const header = cell.dataset.header || 'Value';

        // Remove existing panel
        const existingPanel = document.querySelector('.verification-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Create verification panel (single row layout)
        const panel = document.createElement('div');
        panel.className = 'verification-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h5>Verify: ${header}</h5>
                <button class="close-panel" onclick="document.querySelector('.verification-panel').remove(); document.querySelector('.selected-cell')?.classList.remove('selected-cell');">×</button>
            </div>
            <div class="panel-content-row">
                <div class="field-value">
                    <label>Current Value:</label>
                    <div class="value-display">${value}</div>
                </div>
                <div class="confidence-score">
                    <label>Confidence Score:</label>
                    <div class="confidence-bar-container">
                        <div class="confidence-bar" style="width: ${confidence}%; background-color: ${this.getConfidenceColor(confidence)};">
                            <span class="confidence-text">${confidence.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div class="verification-input">
                    <label>Is this correct?</label>
                    <select class="verification-select" data-cell-id="${cellId}">
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>
                <div class="correction-input" style="display: none;">
                    <label>Enter Correct Value:</label>
                    <input type="text" class="correction-field" placeholder="Enter correction..." />
                </div>
                <div class="save-button-container">
                    <button class="save-verification-btn" data-cell-id="${cellId}">Save</button>
                </div>
            </div>
        `;

        // Insert panel after the selected cell's row
        const row = cell.closest('tr');
        const section = row.closest('.verification-section');
        const tableWrapper = section.querySelector('.table-wrapper');
        tableWrapper.after(panel);

        // Add event listener for verification select
        const select = panel.querySelector('.verification-select');
        const correctionDiv = panel.querySelector('.correction-input');
        select.addEventListener('change', (e) => {
            if (e.target.value === 'no') {
                correctionDiv.style.display = 'flex';
            } else {
                correctionDiv.style.display = 'none';
            }
        });

        // Add event listener for save button
        const saveBtn = panel.querySelector('.save-verification-btn');
        saveBtn.addEventListener('click', () => {
            this.saveVerification(cellId, select.value, panel.querySelector('.correction-field').value);
        });
    }

    getConfidenceScore(value) {
        // Generate a confidence score based on value (demo purposes)
        // In production, this would come from your ML model
        if (!value || value === '') return 50;
        const hash = value.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return 65 + (hash % 35); // Returns value between 65-100
    }

    getConfidenceColor(confidence) {
        if (confidence >= 90) return '#28a745'; // Green
        if (confidence >= 75) return '#ffc107'; // Yellow
        if (confidence >= 60) return '#fd7e14'; // Orange
        return '#dc3545'; // Red
    }

    saveVerification(cellId, isCorrect, correctedValue) {
        this.verifications[cellId] = {
            isCorrect: isCorrect,
            correctedValue: correctedValue,
            timestamp: new Date().toISOString()
        };

        console.log('Verification saved:', this.verifications[cellId]);
        
        // Get cell data for feedback
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        if (cell) {
            // Collect feedback data
            const feedbackData = {
                documentName: this.comparePage.currentDocument,
                tokenId: this.comparePage.resultsData[this.comparePage.currentDocument]?.token_id || 'unknown',
                cellId: cellId,
                section: cell.dataset.section,
                rowIndex: parseInt(cell.dataset.row),
                colIndex: parseInt(cell.dataset.col),
                header: cell.dataset.header,
                originalValue: cell.dataset.value,
                confidence: parseFloat(cell.dataset.confidence),
                isCorrect: isCorrect,
                correctedValue: correctedValue
            };

            // Record feedback using global feedbackCollector
            if (typeof feedbackCollector !== 'undefined') {
                feedbackCollector.recordFeedback(feedbackData);
            }

            // Visual feedback on cell
            if (isCorrect === 'yes') {
                cell.classList.add('verified-correct');
                cell.classList.remove('verified-incorrect');
            } else if (isCorrect === 'no') {
                cell.classList.add('verified-incorrect');
                cell.classList.remove('verified-correct');
            }
        }

        // Close panel
        document.querySelector('.verification-panel')?.remove();
        document.querySelector('.selected-cell')?.classList.remove('selected-cell');

        alert('Verification saved successfully!');
    }

    getVerifications() {
        return this.verifications;
    }

    clearVerifications() {
        this.verifications = {};
    }
}
