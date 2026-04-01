/**
 * Collect Feedback Module
 * 
 * Purpose: Collects and stores user feedback when they verify or correct data
 * 
 * Features:
 * - Tracks user corrections and verifications
 * - Stores feedback in user_feedback.json
 * - Provides analytics on data quality
 * 
 * Data Collected:
 * - Cell information (document, section, row, column, header)
 * - Original value from ML/extraction
 * - Confidence score
 * - User verification (correct/incorrect)
 * - User's corrected value (if provided)
 * - Timestamp
 * 
 * Integration:
 * - Called by InteractiveVerifications when user saves verification
 * - Sends feedback to backend API endpoint
 * - Backend writes to user_feedback.json
 */

class CollectFeedback {
    constructor() {
        this.feedbackQueue = [];
        this.autoSave = true;
    }

    /**
     * Record user feedback for a verified cell
     * @param {Object} feedbackData - The feedback information
     * @param {string} feedbackData.documentName - Name of the document
     * @param {string} feedbackData.tokenId - Token ID of the job
     * @param {string} feedbackData.cellId - Unique cell identifier
     * @param {string} feedbackData.section - Section/verification name
     * @param {number} feedbackData.rowIndex - Row index in table
     * @param {number} feedbackData.colIndex - Column index in table
     * @param {string} feedbackData.header - Column header name
     * @param {string} feedbackData.originalValue - Original extracted value
     * @param {number} feedbackData.confidence - Confidence score (0-100)
     * @param {string} feedbackData.isCorrect - User verification (yes/no)
     * @param {string} feedbackData.correctedValue - User's correction (if provided)
     */
    async recordFeedback(feedbackData) {
        const feedback = {
            id: this.generateFeedbackId(),
            timestamp: new Date().toISOString(),
            document: {
                name: feedbackData.documentName,
                token_id: feedbackData.tokenId
            },
            cell: {
                id: feedbackData.cellId,
                section: feedbackData.section,
                row: feedbackData.rowIndex,
                column: feedbackData.colIndex,
                header: feedbackData.header
            },
            extraction: {
                original_value: feedbackData.originalValue,
                confidence_score: feedbackData.confidence
            },
            user_verification: {
                is_correct: feedbackData.isCorrect === 'yes',
                corrected_value: feedbackData.correctedValue || null,
                correction_needed: feedbackData.isCorrect === 'no'
            },
            metadata: {
                session_id: this.getSessionId(),
                user_agent: navigator.userAgent
            }
        };

        console.log('Recording feedback:', feedback);

        // Add to queue
        this.feedbackQueue.push(feedback);

        // Save to backend if auto-save is enabled
        if (this.autoSave) {
            await this.saveFeedback(feedback);
        }

        return feedback;
    }

    /**
     * Save feedback to backend API
     */
    async saveFeedback(feedback) {
        try {
            const response = await fetch('/api/save-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedback)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✓ Feedback saved successfully:', result);
                return true;
            } else {
                const errorText = await response.text();
                console.error('Failed to save feedback:', errorText);
                return false;
            }
        } catch (error) {
            console.error('Error saving feedback:', error);
            return false;
        }
    }

    /**
     * Save all queued feedback at once
     */
    async saveAllFeedback() {
        if (this.feedbackQueue.length === 0) {
            console.log('No feedback to save');
            return;
        }

        console.log(`Saving ${this.feedbackQueue.length} feedback entries...`);

        const promises = this.feedbackQueue.map(feedback => this.saveFeedback(feedback));
        const results = await Promise.all(promises);
        
        const successCount = results.filter(r => r).length;
        console.log(`Saved ${successCount} of ${this.feedbackQueue.length} feedback entries`);

        // Clear queue after successful save
        this.feedbackQueue = [];
    }

    /**
     * Get feedback statistics
     */
    getStatistics() {
        return {
            total_verifications: this.feedbackQueue.length,
            corrections_needed: this.feedbackQueue.filter(f => f.user_verification.correction_needed).length,
            correct_extractions: this.feedbackQueue.filter(f => f.user_verification.is_correct).length,
            average_confidence: this.feedbackQueue.reduce((sum, f) => sum + f.extraction.confidence_score, 0) / this.feedbackQueue.length || 0
        };
    }

    /**
     * Generate unique feedback ID
     */
    generateFeedbackId() {
        return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get or create session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('verification_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('verification_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Clear all feedback from queue
     */
    clearQueue() {
        this.feedbackQueue = [];
        console.log('Feedback queue cleared');
    }

    /**
     * Toggle auto-save
     */
    setAutoSave(enabled) {
        this.autoSave = enabled;
        console.log(`Auto-save ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Export feedback as JSON
     */
    exportFeedback() {
        return {
            export_timestamp: new Date().toISOString(),
            total_entries: this.feedbackQueue.length,
            statistics: this.getStatistics(),
            feedback: this.feedbackQueue
        };
    }

    /**
     * View current session statistics in console
     */
    viewStatistics() {
        const stats = this.getStatistics();
        console.log('=== Feedback Statistics ===');
        console.log(`Total Verifications: ${stats.total_verifications}`);
        console.log(`Correct Extractions: ${stats.correct_extractions}`);
        console.log(`Corrections Needed: ${stats.corrections_needed}`);
        console.log(`Average Confidence: ${stats.average_confidence.toFixed(2)}%`);
        console.log(`Accuracy Rate: ${stats.total_verifications > 0 ? ((stats.correct_extractions / stats.total_verifications) * 100).toFixed(2) : 0}%`);
        console.log('===========================');
        return stats;
    }

    /**
     * Load and display saved feedback from server
     */
    async loadSavedFeedback() {
        try {
            const response = await fetch('/user_feedback.json');
            if (response.ok) {
                const data = await response.json();
                console.log('=== Saved Feedback Summary ===');
                console.log('Total Entries:', data.metadata.total_entries);
                console.log('Created:', data.metadata.created_at);
                console.log('Last Updated:', data.metadata.last_updated);
                console.log('\nStatistics:');
                console.log('  Total Verifications:', data.statistics.total_verifications);
                console.log('  Correct Extractions:', data.statistics.correct_extractions);
                console.log('  Corrections Needed:', data.statistics.corrections_needed);
                console.log('  Average Confidence:', data.statistics.average_confidence + '%');
                console.log('  Accuracy Rate:', data.statistics.total_verifications > 0 ? 
                    ((data.statistics.correct_extractions / data.statistics.total_verifications) * 100).toFixed(2) + '%' : 'N/A');
                console.log('==============================');
                return data;
            } else {
                console.error('Could not load saved feedback');
                return null;
            }
        } catch (error) {
            console.error('Error loading saved feedback:', error);
            return null;
        }
    }
}

// Create global instance
const feedbackCollector = new CollectFeedback();

// Add helpful console commands
console.log('Feedback Collector loaded. Available commands:');
console.log('  feedbackCollector.viewStatistics() - View current session stats');
console.log('  feedbackCollector.loadSavedFeedback() - View all saved feedback');
console.log('  feedbackCollector.exportFeedback() - Export current session data');
