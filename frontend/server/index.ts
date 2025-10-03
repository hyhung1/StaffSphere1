// This file launches both the FastAPI backend and Vite frontend
// FastAPI serves the API endpoints on port 23000
// Vite serves the frontend on port 12000

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting VIVN Salary Calculator...');

// Start Vite dev server first on port 12000
console.log('Starting Vite frontend server on port 12000...');
const vite = spawn('npx', ['vite', '--port', '12000', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: { 
    ...process.env
    // Don't set VITE_API_BASE - let it default to empty string for same-origin requests
  }
});

// Wait a bit for Vite to start, then start FastAPI
setTimeout(() => {
  console.log('Starting FastAPI backend server on port 23000...');
  const pythonScript = path.join(__dirname, '..', 'start_fastapi.py');
  const fastapi = spawn('python', [pythonScript], {
    stdio: 'inherit',
    env: { 
      ...process.env,
      PORT: '23000'  // Run FastAPI on main port
    }
  });

  // Handle FastAPI errors
  fastapi.on('error', (err) => {
    console.error('Failed to start FastAPI server:', err);
    vite.kill();
    process.exit(1);
  });

  fastapi.on('close', (code) => {
    if (code !== 0) {
      console.log(`FastAPI server exited with code ${code}`);
      vite.kill();
      process.exit(code || 1);
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    fastapi.kill('SIGINT');
    vite.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down servers...');
    fastapi.kill('SIGTERM');
    vite.kill('SIGTERM');
    process.exit(0);
  });
}, 2000);

// Handle Vite errors
vite.on('error', (err) => {
  console.error('Failed to start Vite server:', err);
  process.exit(1);
});

vite.on('close', (code) => {
  if (code !== 0) {
    console.log(`Vite server exited with code ${code}`);
    process.exit(code || 1);
  }
});