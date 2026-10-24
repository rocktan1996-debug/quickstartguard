// Independent diagnostic launcher, not the upstream pnpm quickstart.
// Runs the pinned upstream synthetic example files without modifying them.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('./upstream/', import.meta.url));
const reservation = createServer();
await new Promise((resolve, reject) => {
  reservation.once('error', reject);
  reservation.listen(0, '127.0.0.1', resolve);
});
const port = reservation.address().port;
await new Promise((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
const origin = `http://127.0.0.1:${port}`;

// No .cmd, shell, eval, credential, provider or protocol changes.
function launch(entry, variables, stdio) {
  return spawn(process.execPath, ['--import', 'tsx', entry], {
    cwd, env: { ...process.env, ...variables }, stdio, windowsHide: true,
  });
}
const server = launch('examples/world-browser/local-stack.ts', { PORT: String(port) }, ['ignore', 'pipe', 'pipe']);
// Attach the error listener immediately, before awaiting readiness.
let serverError;
server.on('error', error => { serverError = error; });
server.stderr.pipe(process.stderr);
try {
  await new Promise((resolve, reject) => {
    let output = '';
    const finish = error => {
      clearTimeout(timer);
      server.stdout.off('data', onData);
      server.off('exit', onExit);
      server.off('error', onError);
      error ? reject(error) : resolve();
    };
    const onData = chunk => {
      process.stdout.write(chunk);
      output = (output + chunk.toString()).slice(-8192);
      if (output.includes('"msg":"local-stack listening"')) finish();
    };
    const onExit = code => finish(new Error(`Candidate server exited before readiness: ${code}`));
    const onError = error => finish(error);
    const timer = setTimeout(() => finish(new Error('Candidate server readiness timeout (20s)')), 20_000);
    server.stdout.on('data', onData);
    server.once('exit', onExit);
    server.once('error', onError);
    if (serverError) finish(serverError);
  });
  await new Promise((resolve, reject) => {
    const client = launch('examples/world-browser/scripted-client.ts', {
      X424_RESOURCE_URL: `${origin}/records`, X424_VERIFIER_URL: `${origin}/`,
    }, ['ignore', 'inherit', 'inherit']);
    client.once('error', reject);
    client.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Candidate client exited: ${code ?? signal}`)));
  });
  console.log('x424 candidate launcher passed: synthetic HTTP 201 (not upstream pnpm quickstart)');
} finally {
  if (server.pid && server.exitCode === null && server.signalCode === null) {
    await new Promise((resolve, reject) => {
      const force = setTimeout(() => server.kill('SIGKILL'), 2000);
      const deadline = setTimeout(() => { cleanup(); reject(new Error('Candidate server cleanup timeout')); }, 5000);
      const cleanup = () => { clearTimeout(force); clearTimeout(deadline); server.off('exit', stopped); };
      const stopped = () => { cleanup(); resolve(); };
      server.once('exit', stopped);
      server.kill('SIGTERM');
    });
  }
}
