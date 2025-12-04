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
    },
    
    '/api/save-result': (req, res) => {
        console.log('=== /api/save-result endpoint called ===');
        
        if (req.method !== 'POST') {
            console.log('Method not allowed:', req.method);
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                console.log('Received body:', body.substring(0, 200) + '...');
                const payload = JSON.parse(body);
                const tokenId = payload.token_id;
                const data = payload.data;
                
                console.log('Token ID:', tokenId);
                
                if (!tokenId) {
                    console.log('Error: token_id is required');
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'token_id is required' }));
                    return;
                }
                
                // Save to results folder with token_id as filename
                const resultsFile = path.join(__dirname, 'results', `${tokenId}.json`);
                console.log('Writing to file:', resultsFile);
                
                // Ensure directory exists
                const resultsDir = path.dirname(resultsFile);
                if (!fs.existsSync(resultsDir)) {
                    console.log('Creating directory:', resultsDir);
                    fs.mkdirSync(resultsDir, { recursive: true });
                }
                
                // Write file
                fs.writeFile(resultsFile, JSON.stringify(data, null, 4), 'utf8', (error) => {
                    if (error) {
                        console.error('Failed to write file:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to save file', details: error.message }));
                        return;
                    }
                    
                    console.log('✓ File written successfully:', resultsFile);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Result file saved successfully', filename: `${tokenId}.json` }));
                });
            } catch (error) {
                console.error('Error processing request:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON', details: error.message }));
            }
        });
    },
    
    '/api/save-tokens': (req, res) => {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const tokensFile = path.join(__dirname, 'token_results', 'request-tokens.json');
                
                // Ensure directory exists
                const tokensDir = path.dirname(tokensFile);
                if (!fs.existsSync(tokensDir)) {
                    fs.mkdirSync(tokensDir, { recursive: true });
                }
                
                // Write file
                fs.writeFile(tokensFile, JSON.stringify(data, null, 4), 'utf8', (error) => {
                    if (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to save file', details: error.message }));
                        return;
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'File saved successfully' }));
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON', details: error.message }));
            }
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
