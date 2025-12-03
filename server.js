const http = require('http');
const { handleApiRequest } = require('./api_file_fetch');
const { handleStaticFile } = require('./com-results');

const PORT = 5000;

const server = http.createServer((req, res) => {
    // Check if it's an API request
    if (req.url.startsWith('/api/')) {
        if (handleApiRequest(req, res)) {
            return;
        }
    }

    // Handle static file serving
    handleStaticFile(req, res);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
