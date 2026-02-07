// check-port.js - Check if port is available
const net = require('net');

function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`❌ Port ${port} is already in use`);
                resolve(false);
            }
        });
        
        server.once('listening', () => {
            server.close();
            console.log(`✅ Port ${port} is available`);
            resolve(true);
        });
        
        server.listen(port);
    });
}

async function findAvailablePort(startPort = 5000, maxPort = 5010) {
    console.log(`🔍 Looking for available port between ${startPort}-${maxPort}...`);
    
    for (let port = startPort; port <= maxPort; port++) {
        const isAvailable = await checkPort(port);
        if (isAvailable) {
            console.log(`🎯 Using port: ${port}`);
            return port;
        }
    }
    
    console.log(`❌ No available ports found between ${startPort}-${maxPort}`);
    return null;
}

// Check common ports
async function checkCommonPorts() {
    const commonPorts = [3000, 3001, 5000, 5001, 8080, 8081, 3005, 4000, 4001];
    
    console.log('📊 Checking common ports...\n');
    
    for (const port of commonPorts) {
        await checkPort(port);
    }
}

// Run
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'find') {
        findAvailablePort();
    } else if (args[0]) {
        checkPort(parseInt(args[0]));
    } else {
        checkCommonPorts();
    }
}

module.exports = { checkPort, findAvailablePort };