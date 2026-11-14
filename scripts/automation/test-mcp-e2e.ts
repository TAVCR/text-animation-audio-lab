import { spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';

interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: string | number | null;
  method?: string;
  result?: any;
  error?: any;
  params?: any;
}

class McpTestClient {
  private child: any;
  private pending = new Map<string | number, (res: JsonRpcMessage) => void>();
  private messageCounter = 1;

  constructor(serverScriptPath: string) {
    this.child = spawn('node', [`"${serverScriptPath}"`], {
      stdio: ['pipe', 'pipe', 'inherit'],
      shell: true,
      cwd: path.dirname(serverScriptPath),
    });

    const rl = readline.createInterface({
      input: this.child.stdout,
      terminal: false,
    });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const msg = JSON.parse(trimmed) as JsonRpcMessage;
        if (msg.id && this.pending.has(msg.id)) {
          const resolve = this.pending.get(msg.id)!;
          this.pending.delete(msg.id);
          resolve(msg);
        }
      } catch (err) {
        console.error('[Client parse error]', err, line);
      }
    });
  }

  async request(method: string, params?: Record<string, unknown>): Promise<JsonRpcMessage> {
    const id = this.messageCounter++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      const req: JsonRpcMessage = {
        jsonrpc: '2.0',
        id,
        method,
        ...(params ? { params } : {}),
      };
      this.child.stdin.write(JSON.stringify(req) + '\n');
    });
  }

  close() {
    this.child.kill();
  }
}

async function runMcpE2e() {
  console.log('=== STARTING MCP END-TO-END VERIFICATION ===\n');

  const serverBin = path.resolve(__dirname, '..', '..', 'bin', 'text-animation-mcp.cjs');
  const client = new McpTestClient(serverBin);

  // 1. Initialize
  console.log('[1/8] Testing initialize...');
  const initRes = await client.request('initialize');
  console.log('Initialize Result:', JSON.stringify(initRes.result, null, 2));

  // 2. List animations
  console.log('\n[2/8] Testing tools/call list_animations...');
  const listRes = await client.request('tools/call', { name: 'list_animations', arguments: {} });
  const listData = JSON.parse(listRes.result.content[0].text);
  console.log(`Discovered ${listData.count} animations.`);
  if (listData.count !== 32) throw new Error('Expected exactly 32 animations');

  // 3. Describe animation
  console.log('\n[3/8] Testing tools/call describe_animation (typewriter)...');
  const descRes = await client.request('tools/call', { name: 'describe_animation', arguments: { animationId: 'typewriter' } });
  const descData = JSON.parse(descRes.result.content[0].text);
  console.log('Typewriter description:', descData.animation.name, 'Controls count:', descData.animation.schema.length);

  // 4. Render Still (Real PNG)
  console.log('\n[4/8] Testing tools/call render_still (Real PNG still)...');
  const stillRes = await client.request('tools/call', {
    name: 'render_still',
    arguments: {
      animationId: 'typewriter',
      text: 'MCP STILL TEST',
      aspectRatio: '9:16',
      resolutionPreset: '1080p',
      frameIndex: 25,
      outputName: 'mcp-test-png',
    },
  });
  const stillData = JSON.parse(stillRes.result.content[0].text);
  console.log('Render still outcome:', stillData);
  if (!stillData.success || !stillData.artifact) throw new Error('render_still failed');

  // 5. Render Video (Real H264)
  console.log('\n[5/8] Testing tools/call render_animation (Real H264 MP4)...');
  const videoRes = await client.request('tools/call', {
    name: 'render_animation',
    arguments: {
      animationId: 'typewriter',
      text: 'MCP H264 TEST',
      aspectRatio: '16:9',
      resolutionPreset: '1080p',
      profile: 'h264-opaque',
      durationInFrames: 60,
      outputName: 'mcp-test-h264',
    },
  });
  const videoData = JSON.parse(videoRes.result.content[0].text);
  console.log('Render video outcome:', videoData);
  if (!videoData.success || !videoData.artifact) throw new Error('render_animation failed');

  // 6. Invalid animation parameter rejected
  console.log('\n[6/8] Testing invalid parameter rejection...');
  const badParamRes = await client.request('tools/call', {
    name: 'render_animation',
    arguments: {
      animationId: 'typewriter',
      text: 'FAIL TEST',
      parameters: {
        bogusParameter: 999,
      },
    },
  });
  const badParamData = JSON.parse(badParamRes.result.content[0].text);
  console.log('Bad parameter outcome (expected isError):', badParamRes.result.isError, badParamData.error);
  if (!badParamRes.result.isError) throw new Error('Expected parameter rejection');

  // 7. Path traversal attempt rejected
  console.log('\n[7/8] Testing path traversal rejection in outputName...');
  const traversalRes = await client.request('tools/call', {
    name: 'render_animation',
    arguments: {
      animationId: 'typewriter',
      text: 'TRAVERSAL TEST',
      outputName: '../../malicious-file',
    },
  });
  const traversalData = JSON.parse(traversalRes.result.content[0].text);
  console.log('Traversal outcome (expected isError):', traversalRes.result.isError, traversalData.error);
  if (!traversalRes.result.isError) throw new Error('Expected traversal rejection');

  // 8. Inspect render
  console.log('\n[8/8] Testing tools/call inspect_render against produced artifact...');
  const inspectRes = await client.request('tools/call', {
    name: 'inspect_render',
    arguments: {
      artifactPath: stillData.artifact.path,
    },
  });
  const inspectData = JSON.parse(inspectRes.result.content[0].text);
  console.log('Inspect render outcome:', inspectData);
  if (!inspectData.success || !inspectData.media) throw new Error('inspect_render failed');

  client.close();
  console.log('\n=== MCP END-TO-END VERIFICATION SUCCEEDED ===');
}

runMcpE2e().catch((err) => {
  console.error('Fatal MCP E2E Error:', err);
  process.exit(1);
});
