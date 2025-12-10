# User Feedback Collection System

## Overview
This system collects and stores user feedback when they verify or correct data in the Compare Results page. It helps track data quality and model performance.

## Files

### 1. `collect_feedback.js`
**Purpose**: Handles all feedback collection actions and API communication

**Key Features**:
- Records user verifications (correct/incorrect)
- Stores corrected values when users fix errors
- Tracks confidence scores and accuracy
- Auto-saves to backend API
- Provides statistics and analytics

**Main Methods**:
```javascript
// Record feedback for a cell
feedbackCollector.recordFeedback(feedbackData)

// View current session statistics
feedbackCollector.viewStatistics()

// Load and view all saved feedback
feedbackCollector.loadSavedFeedback()

// Export current session data
feedbackCollector.exportFeedback()

// Save all queued feedback
feedbackCollector.saveAllFeedback()
```

### 2. `user_feedback.json`
**Purpose**: Stores all user feedback data

**Structure**:
```json
{
    "feedback_entries": [
        {
            "id": "unique_feedback_id",
            "timestamp": "ISO date string",
            "document": {
                "name": "document filename",
                "token_id": "job token"
            },
            "cell": {
                "id": "cell identifier",
                "section": "verification section",
                "row": 0,
                "column": 0,
                "header": "column name"
            },
            "extraction": {
                "original_value": "extracted value",
                "confidence_score": 95.5
            },
            "user_verification": {
                "is_correct": true/false,
                "corrected_value": "user's correction or null",
                "correction_needed": true/false
            },
            "metadata": {
                "session_id": "unique session",
                "user_agent": "browser info"
            }
        }
    ],
    "metadata": {
        "created_at": "when file was created",
        "last_updated": "last feedback timestamp",
        "total_entries": 0,
        "version": "1.0"
    },
    "statistics": {
        "total_verifications": 0,
        "correct_extractions": 0,
        "corrections_needed": 0,
        "average_confidence": 0
    }
}
```

## Integration

### How it Works
1. User clicks a cell in the Compare Results table
2. User verifies if content is correct (Yes/No)
3. If No, user enters corrected value
4. On save, `InteractiveVerifications` calls `feedbackCollector.recordFeedback()`
5. Feedback is sent to backend API `/api/save-feedback`
6. Backend appends to `user_feedback.json` and updates statistics

### Backend API Endpoint
**POST** `/api/save-feedback`

The endpoint:
- Reads existing `user_feedback.json`
- Appends new feedback entry
- Updates metadata (last_updated, total_entries)
- Recalculates statistics
- Saves updated file

## Usage Examples

### View Current Session Stats
```javascript
// In browser console
feedbackCollector.viewStatistics()
```

Output:
```
=== Feedback Statistics ===
Total Verifications: 15
Correct Extractions: 12
Corrections Needed: 3
Average Confidence: 87.45%
Accuracy Rate: 80.00%
===========================
```

### View All Saved Feedback
```javascript
// In browser console
feedbackCollector.loadSavedFeedback()
```

### Export Session Data
```javascript
// In browser console
const sessionData = feedbackCollector.exportFeedback()
console.log(sessionData)
```

## Analytics & Insights

The feedback data helps you understand:

1. **Model Accuracy**: What percentage of extractions are correct?
2. **Confidence Calibration**: Do high confidence scores correlate with accuracy?
3. **Problem Areas**: Which fields/sections need the most corrections?
4. **User Patterns**: How are users interacting with the verification system?

### Key Metrics
- **Accuracy Rate**: (Correct Extractions / Total Verifications) × 100
- **Correction Rate**: (Corrections Needed / Total Verifications) × 100
- **Average Confidence**: Mean confidence score across all verifications
- **Confidence vs. Accuracy**: Compare confidence scores to actual correctness

## Best Practices

1. **Regular Review**: Check `user_feedback.json` regularly to identify patterns
2. **Model Improvement**: Use corrections to retrain/improve extraction models
3. **Threshold Tuning**: Adjust confidence thresholds based on feedback data
4. **User Training**: Use common errors to improve user training materials

## Data Privacy
- User agent information is stored for debugging purposes
- Session IDs are generated client-side (stored in sessionStorage)
- No personally identifiable information is collected
- Feedback data is stored locally on the server

## Future Enhancements
- Export feedback to CSV for analysis
- Dashboard for visualizing feedback trends
- Filter feedback by document type, date range, etc.
- Automated reports on model performance
- Integration with ML model retraining pipeline
