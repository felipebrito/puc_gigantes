const os = require('os');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (non-127.0.0.1) and non-ipv4
            if ('IPv4' !== iface.family || iface.internal) {
                continue;
            }
            return iface.address;
        }
    }
    return 'localhost';
}

console.log(`\n🦕 SERVER RUNNING (HTTPS) 🦕`);
console.log(`Local Address: https://localhost:3000`);
console.log(`Network Address: https://${getLocalIP()}:3000`);
console.log(`\nNote: Accept the "Not Secure" warning in your browser to proceed.\n`);
