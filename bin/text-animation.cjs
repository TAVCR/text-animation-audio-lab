#!/usr/bin/env node
const path = require('node:path');
const { spawn } = require('node:child_process');

const cliPath = path.resolve(__dirname, '..', 'src', 'automation', 'cli.ts');
const tsx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn('npx', ['tsx', `"${cliPath}"`, ...process.argv.slice(2).map(a => a.includes(' ') ? `"${a}"` : a)], {
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
