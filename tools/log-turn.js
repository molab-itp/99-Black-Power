#!/usr/bin/env node
// Claude Code Stop hook: appends each finished exchange to Log.md.
//
// The final reply reaches the transcript after the hook fires, so the hook starts a
// detached copy of this script that waits for the reply before writing.
//
//   log-turn.js                               hook mode: reads the hook's JSON on stdin
//   log-turn.js --write <transcript> <log>    writes every exchange not yet logged
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const POLL_MS = 500;
const SETTLED_MS = 2000; // transcript unchanged for this long
const MAX_WAIT_MS = 60_000;

const blocks = (e) => (typeof e.message.content === 'string' ? [{ type: 'text', text: e.message.content }] : e.message.content);
const textOf = (e) => blocks(e).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
const cleanPrompt = (e) =>
  textOf(e)
    .replace(/<(system-reminder|ide_selection)>[\s\S]*?<\/\1>/g, '')
    .replace(/<\/?pasted_content[^>]*>/g, '')
    .trim();
// A real prompt has text of its own and no tool_result.
const isPrompt = (e) => e.type === 'user' && !e.isMeta && !e.isSidechain && !blocks(e).some((b) => b.type === 'tool_result') && cleanPrompt(e);
const isReply = (e) => e.type === 'assistant' && !e.isSidechain;

function readEntries(transcript) {
  return fs.readFileSync(transcript, 'utf8').trim().split('\n').map(JSON.parse);
}

function isFinished(transcript) {
  if (Date.now() - fs.statSync(transcript).mtimeMs < SETTLED_MS) return false;
  const entries = readEntries(transcript);
  const last = entries.findLast((e) => isReply(e) || isPrompt(e));
  return Boolean(last) && isReply(last) && textOf(last) !== '' && !blocks(last).some((b) => b.type === 'tool_use');
}

async function write(transcript, logFile) {
  const started = Date.now();
  while (!isFinished(transcript) && Date.now() - started < MAX_WAIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  const stateFile = `${logFile}.state`;
  let state = '';
  try {
    state = fs.readFileSync(stateFile, 'utf8').trim();
  } catch {}

  const entries = readEntries(transcript);
  const prompts = entries.flatMap((e, i) => (isPrompt(e) ? [i] : []));
  const done = prompts.findIndex((i) => entries[i].uuid === state);
  for (const [n, start] of prompts.entries()) {
    if (n <= done) continue;
    const reply = entries.slice(start + 1, prompts[n + 1]).filter(isReply).map(textOf).filter(Boolean).join('\n\n');
    const when = new Date(entries[start].timestamp).toLocaleString();
    fs.appendFileSync(logFile, `\n---\n\n## User (${when})\n\n\`\`\`\n${cleanPrompt(entries[start])}\n\`\`\`\n\n## Assistant\n\n${reply}\n`);
    fs.writeFileSync(stateFile, entries[start].uuid);
  }
}

if (process.argv[2] === '--write') {
  write(process.argv[3], process.argv[4]);
} else {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  const logFile = process.env.CHAT_LOG || path.join(input.cwd, 'Log.md');
  spawn(process.execPath, [__filename, '--write', input.transcript_path, logFile], { detached: true, stdio: 'ignore' }).unref();
}
