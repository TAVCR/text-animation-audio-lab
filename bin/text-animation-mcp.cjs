#!/usr/bin/env node
const path = require('node:path');
const { spawn } = require('node:child_process');

const serverPath = path.resolve(__dirname, '..', 'src', 'automation', 'mcp-server.ts');

const child = spawn('npx', ['tsx', `"${serverPath}"`], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  shell: true,
  env: {
    ...process.env,
    INVOKER_CWD: process.cwd(),
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
