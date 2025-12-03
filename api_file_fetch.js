const fs = require('fs');
const path = require('path');

// API endpoint handlers
const apiHandlers = {
    '/api/results': (req, res) => {
        const resultsDir = path.join(__dirname, 'results');
        fs.readdir(resultsDir, (error, files) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unable to read results directory' }));
                return;
            }
            
            // Filter only .json files
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ files: jsonFiles }));
        });
    }
};

// Handle API requests
function handleApiRequest(req, res) {
    const handler = apiHandlers[req.url];
    
    if (handler) {
        handler(req, res);
        return true;
    }
    
    return false;
}

module.exports = { handleApiRequest };
