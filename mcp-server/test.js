const { spawn } = require('child_process');
const path = require('path');

// Path to the server
const serverPath = path.join(__dirname, 'server.js');

// Start the MCP server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let messageId = 1;

// Function to send a message
function sendMessage(method, params = {}) {
  const message = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };
  server.stdin.write(JSON.stringify(message) + '\n');
}

// Handle responses
server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      console.log('Response:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Raw output:', line);
    }
  });
});

// Test sequence
setTimeout(() => {
  console.log('Sending initialize...');
  sendMessage('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  });
}, 1000);

setTimeout(() => {
  console.log('Sending tools/list...');
  sendMessage('tools/list');
}, 2000);

setTimeout(() => {
  console.log('Sending tools/call for search_cards...');
  sendMessage('tools/call', {
    name: 'search_cards',
    arguments: { query: '妙蛙種子', limit: 5 }
  });
}, 3000);

setTimeout(() => {
  console.log('Sending tools/call for get_expansions...');
  sendMessage('tools/call', {
    name: 'get_expansions'
  });
}, 4000);

// Exit after tests
setTimeout(() => {
  server.kill();
  process.exit(0);
}, 5000);