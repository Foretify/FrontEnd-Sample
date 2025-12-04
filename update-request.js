const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:8000';
const REQUESTS_FILE = path.join(__dirname, 'token_results', 'request-tokens.json');

/**
 * Make HTTP GET request to check job status
 */
function checkJobStatus(tokenId) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE_URL}/api/job-status/${tokenId}`;
        
        http.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                } else {
                    reject(new Error(`API returned status ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`HTTP request failed: ${error.message}`));
        });
    });
}

/**
 * Load requests from JSON file
 */
function loadRequests() {
    try {
        const fileContent = fs.readFileSync(REQUESTS_FILE, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error loading requests file: ${error.message}`);
        return { requests: [] };
    }
}

/**
 * Save updated requests to JSON file
 */
function saveRequests(data) {
    try {
        fs.writeFileSync(REQUESTS_FILE, JSON.stringify(data, null, 4), 'utf8');
        console.log('Requests file updated successfully');
    } catch (error) {
        console.error(`Error saving requests file: ${error.message}`);
    }
}

/**
 * Update status for all pending requests
 */
async function updateRequestStatuses() {
    console.log('Starting request status update...\n');
    
    const requestsData = loadRequests();
    
    if (!requestsData.requests || requestsData.requests.length === 0) {
        console.log('No requests found to update.');
        return;
    }
    
    let updatedCount = 0;
    let alreadyCompletedCount = 0;
    let errorCount = 0;
    
    // Process each request
    for (const request of requestsData.requests) {
        const tokenId = request.token_id;
        
        // Skip if already marked as SUCCESS or completed
        if (request.status === 'SUCCESS' || request.status === 'completed') {
            console.log(`✓ ${tokenId}: Already completed`);
            alreadyCompletedCount++;
            continue;
        }
        
        console.log(`Checking ${tokenId}...`);
        
        try {
            // Check job status from API
            const jobStatus = await checkJobStatus(tokenId);
            
            if (jobStatus.status === 'completed') {
                // Update status to SUCCESS
                request.status = 'SUCCESS';
                
                // Optionally update other fields from API response
                if (jobStatus.completed_at) {
                    request.completed_at = jobStatus.completed_at;
                }
                if (jobStatus.result) {
                    request.result = jobStatus.result;
                }
                
                console.log(`✓ ${tokenId}: Updated to SUCCESS`);
                updatedCount++;
            } else {
                console.log(`⏳ ${tokenId}: Still ${jobStatus.status}`);
            }
            
        } catch (error) {
            console.error(`✗ ${tokenId}: Error - ${error.message}`);
            errorCount++;
        }
    }
    
    // Save updated data
    if (updatedCount > 0) {
        saveRequests(requestsData);
    }
    
    // Summary
    console.log('\n--- Update Summary ---');
    console.log(`Updated to SUCCESS: ${updatedCount}`);
    console.log(`Already completed: ${alreadyCompletedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total requests: ${requestsData.requests.length}`);
}

// Run the update
if (require.main === module) {
    updateRequestStatuses()
        .then(() => {
            console.log('\nUpdate process completed.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\nFatal error:', error);
            process.exit(1);
        });
}

module.exports = { updateRequestStatuses, checkJobStatus };
