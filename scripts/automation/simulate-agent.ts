import path from 'node:path';
import { executeMcpTool } from '../../src/automation/mcp-tools';

async function runAutonomousSimulation() {
  console.log('=== RUNNING CODEX-STYLE AUTONOMOUS AGENT ORCHESTRATION SIMULATION ===\n');
  console.log('Target User Goal: "Create a vertical animated title that says CURSO GRUPAL using Text Animation and produce a transparent video suitable for importing into a video editor."\n');

  // Step 1: Agent queries available animations
  console.log('[Agent Step 1] Querying available animations via list_animations...');
  const listOutcome = await executeMcpTool('list_animations', {});
  const listData = JSON.parse(listOutcome.content[0].text);
  console.log(`Agent evaluated ${listData.count} available animation templates.`);

  // Step 2: Agent inspects chosen animation (e.g. typewriter)
  console.log('\n[Agent Step 2] Inspecting chosen animation template "typewriter" via describe_animation...');
  const descOutcome = await executeMcpTool('describe_animation', { animationId: 'typewriter' });
  const descData = JSON.parse(descOutcome.content[0].text);
  console.log(`Animation template: "${descData.animation.name}", Family: ${descData.animation.family}`);
  console.log('Capabilities:', descData.animation.capabilities.join(', '));

  // Step 3: Agent calls render_animation with:
  // - Vertical aspect ratio: '9:16'
  // - Text: 'CURSO GRUPAL'
  // - Transparent video profile for video editor import: 'prores4444-alpha'
  console.log('\n[Agent Step 3] Calling render_animation for "CURSO GRUPAL" in 9:16 with profile prores4444-alpha...');
  const renderOutcome = await executeMcpTool('render_animation', {
    animationId: 'typewriter',
    text: 'CURSO GRUPAL',
    aspectRatio: '9:16',
    resolutionPreset: '1080p',
    profile: 'prores4444-alpha',
    durationInFrames: 60,
    outputName: 'agent-curso-grupal-prores',
  });

  if (renderOutcome.isError) {
    console.error('Agent render failed:', renderOutcome.content[0].text);
    process.exit(1);
  }

  const renderData = JSON.parse(renderOutcome.content[0].text);
  console.log('Render Job Completed Successfully!');
  console.log('Artifact details:', JSON.stringify(renderData.artifact, null, 2));

  // Step 4: Agent inspects artifact to confirm alpha plane before presenting to user
  console.log('\n[Agent Step 4] Inspecting final artifact using inspect_render...');
  const inspectOutcome = await executeMcpTool('inspect_render', {
    artifactPath: renderData.artifact.path,
  });
  const inspectData = JSON.parse(inspectOutcome.content[0].text);
  console.log('Media Inspection Results:', JSON.stringify(inspectData.media, null, 2));

  console.log('\n=== SIMULATION COMPLETED SUCCESSFULLY ===');
}

runAutonomousSimulation().catch((err) => {
  console.error('Simulation error:', err);
  process.exit(1);
});
