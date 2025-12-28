#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsxPath = join(__dirname, 'node_modules', '.bin', 'tsx');
const entryPath = join(__dirname, 'src', 'index.tsx');

spawnSync(tsxPath, [entryPath], { stdio: 'inherit' });
