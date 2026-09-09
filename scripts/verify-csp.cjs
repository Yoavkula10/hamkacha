const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const headers = fs.readFileSync('_headers', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

assert.equal(scripts.length, 1, 'expected exactly one hashed inline application script');
const hash = 'sha256-' + crypto.createHash('sha256').update(scripts[0][1]).digest('base64');
assert.ok(headers.includes(`'${hash}'`), 'CSP hash must match the inline application script');
assert.ok(!headers.includes("script-src 'self' 'unsafe-inline'"), 'script-src must not allow unsafe-inline');
console.log('CSP verification passed');
