#!/usr/bin/env node
import readline from 'node:readline';
import { TEXT_ANIMATION_TOOLS, executeMcpTool } from './mcp-tools';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function sendResponse(res: JsonRpcResponse) {
  process.stdout.write(JSON.stringify(res) + '\n');
}

export function startMcpServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let req: JsonRpcRequest;
    try {
      req = JSON.parse(trimmed);
    } catch {
      sendResponse({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: invalid JSON' },
      });
      return;
    }

    const id = req.id ?? null;

    switch (req.method) {
      case 'initialize': {
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'text-animation-automation',
              version: '0.1.4',
            },
          },
        });
        break;
      }

      case 'notifications/initialized': {
        // Notification, no reply expected
        break;
      }

      case 'tools/list': {
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            tools: TEXT_ANIMATION_TOOLS,
          },
        });
        break;
      }

      case 'tools/call': {
        const toolName = String(req.params?.name ?? '');
        const toolArgs = (req.params?.arguments && typeof req.params.arguments === 'object')
          ? (req.params.arguments as Record<string, unknown>)
          : {};

        try {
          const outcome = await executeMcpTool(toolName, toolArgs);
          sendResponse({
            jsonrpc: '2.0',
            id,
            result: outcome,
          });
        } catch (err) {
          sendResponse({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32603,
              message: `Internal tool execution error: ${err instanceof Error ? err.message : String(err)}`,
            },
          });
        }
        break;
      }

      case 'ping': {
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {},
        });
        break;
      }

      default: {
        sendResponse({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${req.method}` },
        });
        break;
      }
    }
  });

  process.stderr.write('[Text Animation MCP Server] Started stdio transport listening.\n');
}

if (require.main === module || (typeof process.env.RUN_MCP !== 'undefined' && process.env.RUN_MCP === 'true')) {
  startMcpServer();
}
