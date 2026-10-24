#!/usr/bin/env node
/**
 * scripts/build-bundle.js
 *
 * SHAMS HEALTH CARE — Universal Runtime Bundle Builder
 * Compiles ES6 modular source code under assets/js/ into a single IIFE bundle: assets/js/bundle.js
 *
 * Guarantees zero-dependency build (<1 second) using native Node.js APIs (fs, path, vm).
 *
 * Usage:
 *   node scripts/build-bundle.js          # Build bundle.js once
 *   node scripts/build-bundle.js --check  # Verify bundle is in sync (CI check)
 *   node scripts/build-bundle.js --watch  # Watch source modules and re-bundle on save
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'assets', 'js', 'bundle.js');

// Dependency-ordered list of source modules
const MODULE_ORDER = [
  'assets/js/config/auth-config.js',
  'assets/js/config/test-constants.js',
  'assets/js/config/pricing-config.js',
  'assets/js/config/supabase-config.js',
  'assets/js/state/storage.js',
  'assets/js/state/app-state.js',
  'assets/js/state/inventory-state.js',
  'assets/js/utils/date-helpers.js',
  'assets/js/utils/patient-id.js',
  'assets/js/utils/dom-helpers.js',
  'assets/js/calculators/cbc-calculator.js',
  'assets/js/calculators/cost-calculator.js',
  'assets/js/services/duplicate-service.js',
  'assets/js/services/pdf-service.js',
  'assets/js/services/stats-service.js',
  'assets/js/services/search-service.js',
  'assets/js/services/report-builder.js',
  'assets/js/services/report-paginator.js',
  'assets/js/services/history-service.js',
  'assets/js/services/report-actions.js',
  'assets/js/services/inventory-service.js',
  'assets/js/services/idle-service.js',
  'assets/js/ui/form-ui.js',
  'assets/js/services/invoice-service.js',
  'assets/js/app.js'
];

/**
 * Strips ES6 imports and exports from a module for universal IIFE concatenation.
 */
function transformModule(content) {
  let code = content;

  // 1. Remove ES6 import statements (single-line & multi-line)
  // Handles: import { a, b } from './path.js';
  // Handles: import defaultExport from './path.js';
  // Handles: import * as name from './path.js';
  code = code.replace(/import\s+(?:[\w*\s{},]*\s+from\s+)?['"][^'"]+['"];?\r?\n?/g, '');

  // 2. Remove re-export lists without declarations: export { a, b };
  code = code.replace(/export\s*\{[^}]*\};?\r?\n?/g, '');

  // 3. Transform export declarations into local declarations
  // Handles: export function foo() -> function foo()
  // Handles: export async function foo() -> async function foo()
  // Handles: export const foo = ... -> const foo = ...
  // Handles: export let foo = ... -> let foo = ...
  // Handles: export var foo = ... -> var foo = ...
  // Handles: export class Foo -> class Foo
  code = code.replace(/^export\s+(async\s+function|function|const|let|var|class)\s+/gm, '$1 ');

  // 4. Strip duplicate 'use strict' declarations inside modules
  code = code.replace(/['"]use strict['"];?\r?\n?/g, '');

  // 5. Trim extraneous whitespace at beginning and end
  return code.trim();
}

/**
 * Assembles the universal IIFE bundle.
 */
function generateBundle() {
  const parts = [];

  // Header Banner
  parts.push(`/**
 * SHAMS HEALTH CARE - Lab Report Generator
 * Universal Bundle (Supports both file:/// local execution & HTTP servers)
 * Generated automatically from modular architecture in assets/js/
 * 
 * To rebuild after editing source modules:
 *   node scripts/build-bundle.js
 */
(function () {
  'use strict';
`);

  for (const relPath of MODULE_ORDER) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Source module not found: ${relPath}`);
    }

    const rawContent = fs.readFileSync(fullPath, 'utf8');
    const transformed = transformModule(rawContent);

    parts.push(`\n  /* ===== Module: ${relPath} ===== */\n  ${transformed.replace(/\n/g, '\n  ')}\n`);
  }

  // IIFE Footer
  parts.push(`\n})();\n`);

  return parts.join('');
}

/**
 * Validates JS syntax using Node's vm compiler.
 */
function validateSyntax(code) {
  try {
    new vm.Script(code, { filename: 'bundle.js' });
    return true;
  } catch (err) {
    throw new Error(`Syntax validation failed for generated bundle:\n${err.message}\nLine ${err.stack}`);
  }
}

/**
 * Main build execution
 */
function build(checkOnly = false) {
  const startTime = Date.now();
  console.log(`📦 Bundling ${MODULE_ORDER.length} modules...`);

  const bundleCode = generateBundle();
  validateSyntax(bundleCode);

  const duration = Date.now() - startTime;
  const sizeKb = (Buffer.byteLength(bundleCode, 'utf8') / 1024).toFixed(1);
  const lineCount = bundleCode.split('\n').length;

  if (checkOnly) {
    if (!fs.existsSync(OUTPUT_FILE)) {
      console.error(`❌ Check failed: ${OUTPUT_FILE} does not exist.`);
      process.exit(1);
    }
    const currentCode = fs.readFileSync(OUTPUT_FILE, 'utf8');
    if (currentCode !== bundleCode) {
      console.error(`❌ Check failed: ${OUTPUT_FILE} is out of sync with source modules. Run "node scripts/build-bundle.js" to update.`);
      process.exit(1);
    }
    console.log(`✅ Bundle is in sync with source modules (${sizeKb} KB, ${lineCount} lines).`);
    return;
  }

  fs.writeFileSync(OUTPUT_FILE, bundleCode, 'utf8');
  console.log(`✅ Successfully built ${OUTPUT_FILE}`);
  console.log(`   Size: ${sizeKb} KB | Lines: ${lineCount} | Time: ${duration}ms`);
}

// CLI argument handling
const args = process.argv.slice(2);
if (args.includes('--check')) {
  build(true);
} else if (args.includes('--watch')) {
  build(false);
  console.log('👀 Watching assets/js/ for changes (Ctrl+C to stop)...');
  const watchDir = path.join(ROOT_DIR, 'assets', 'js');
  fs.watch(watchDir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.js') && !filename.endsWith('bundle.js')) {
      console.log(`🔄 Change detected in ${filename}, rebuilding...`);
      try {
        build(false);
      } catch (err) {
        console.error('❌ Build error:', err.message);
      }
    }
  });
} else {
  build(false);
}
