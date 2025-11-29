import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple diagnostic script to test the Electron app and capture console output
 */

async function runDiagnostic() {
  console.log('🎯 Running simple diagnostic...');

  const electronProcess = spawn('pnpm', ['exec', 'electron', 'apps/electron-main/dist/main.js', '--enable-logging', '--v=1'], {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_RENDERER_URL: 'http://localhost:5173'
    }
  });

  let output = '';
  let errorOutput = '';

  electronProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log('[STDOUT]', text.trim());
  });

  electronProcess.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    console.error('[STDERR]', text.trim());
  });

  electronProcess.on('error', (error) => {
    console.error('❌ Process error:', error);
  });

  // Wait a bit for startup, then terminate
  setTimeout(() => {
    console.log('\n🔊 Attempting to capture diagnostics...');

    // Try to send a simple signal or check if the process is still running
    if (!electronProcess.killed) {
      console.log('✅ Electron process is running');

      // Let it run a bit more to see if it connects to the renderer
      setTimeout(() => {
        electronProcess.kill('SIGTERM');
      }, 5000);
    }
  }, 3000);

  electronProcess.on('close', (code) => {
    console.log(`\n🏁 Process exited with code ${code}`);

    // Analyze output for key patterns
    console.log('\n📊 Analysis:');

    if (output.includes('categoria:listarArbol handled')) {
      console.log('✅ Categoria handlers are working');
    } else {
      console.log('❌ Categoria handlers may not be working');
    }

    if (output.includes('presentacion:listar handled')) {
      console.log('✅ Presentacion handlers are working');
    } else {
      console.log('❌ Presentacion handlers may not be working');
    }

    if (errorOutput.includes('ECONNREFUSED') || errorOutput.includes('ENOTFOUND')) {
      console.log('❌ Database connection issues detected');
    }

    if (output.includes('Database connection verified')) {
      console.log('✅ Database connection is working');
    }
  });
}

runDiagnostic().catch(console.error);