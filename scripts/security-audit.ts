#!/usr/bin/env bun

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface AuditResult {
  exitCode: number;
  output: string;
  hasVulnerabilities: boolean;
  vulnerabilities: string[];
}

console.log('🔒 Running comprehensive security audit with Bun...\n');

const results: AuditResult = {
  exitCode: 0,
  output: '',
  hasVulnerabilities: false,
  vulnerabilities: []
};

// Function to execute command and capture output
function runCommand(command: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || error.stderr || error.message
    };
  }
}

// 1. Bun Security Audit
console.log('1️⃣ Running Bun security audit...');
const audit = runCommand('bun audit');

if (audit.success) {
  console.log('✅ No security vulnerabilities found\n');
} else {
  console.log('⚠️ Security issues found:');
  console.log(audit.output);

  results.hasVulnerabilities = true;
  results.vulnerabilities.push(audit.output);
  results.exitCode = 1;
}

// 2. Check for outdated packages
console.log('2️⃣ Checking for outdated packages...');
const outdated = runCommand('bun outdated');

if (outdated.success) {
  console.log('✅ All packages are up to date\n');
} else {
  console.log('📦 Outdated packages:');
  console.log(outdated.output);
}

// 3. Check license information
console.log('3️⃣ Checking package licenses...');
const licenseCheck = runCommand('bun pm ls --all');

if (licenseCheck.success) {
  console.log('✅ License information retrieved\n');
} else {
  console.log('⚠️ Could not retrieve license information');
}

// 4. Scan for sensitive patterns in common files
console.log('4️⃣ Scanning for potential sensitive data patterns...');
const sensitiveFiles = ['.env', '.env.example', 'config.json'];
const sensitivePatterns = [
  /password\s*=\s*['"]?([^'"\s]+)/gi,
  /api[_-]?key\s*=\s*['"]?([^'"\s]+)/gi,
  /secret[_-]?key\s*=\s*['"]?([^'"\s]+)/gi,
  /token\s*=\s*['"]?([^'"\s]+)/gi
];

let foundSensitivePatterns = false;
for (const file of sensitiveFiles) {
  if (existsSync(file)) {
    try {
      const content = execSync(`type "${file}"`, { encoding: 'utf8' });
      for (const pattern of sensitivePatterns) {
        if (pattern.test(content)) {
          console.log(`⚠️ Found sensitive pattern in ${file}`);
          foundSensitivePatterns = true;
          break;
        }
      }
    } catch {
      // Ignore errors reading files
    }
  }
}

if (!foundSensitivePatterns) {
  console.log('✅ No obvious sensitive patterns found in common files\n');
}

// 5. Generate summary report
console.log('\n📊 SECURITY AUDIT SUMMARY');
console.log('================================');
console.log(`Status: ${results.hasVulnerabilities ? '❌ VULNERABILITIES FOUND' : '✅ SECURE'}`);
console.log(`Vulnerabilities: ${results.vulnerabilities.length}`);
console.log(`Exit Code: ${results.exitCode}`);

// Save detailed results to file for GitHub Actions
const reportContent = {
  timestamp: new Date().toISOString(),
  audit: {
    hasVulnerabilities: results.hasVulnerabilities,
    vulnerabilities: results.vulnerabilities,
    packages: audit.output
  },
  outdated: outdated.output,
  licenses: licenseCheck.output,
  sensitivePatternsFound: foundSensitivePatterns
};

writeFileSync(
  join(process.cwd(), 'security-audit-report.json'),
  JSON.stringify(reportContent, null, 2)
);

// Also save a human-readable version
const humanReadableReport = `
# Security Audit Report
Generated: ${new Date().toISOString()}

## Security Status: ${results.hasVulnerabilities ? '❌ VULNERABILITIES FOUND' : '✅ SECURE'}

## Vulnerabilities
${results.vulnerabilities.length > 0 ? results.vulnerabilities.join('\n\n') : 'No vulnerabilities found'}

## Package Updates Needed
${outdated.output || 'All packages up to date'}

## Sensitive Patterns Found
${foundSensitivePatterns ? '⚠️ Potential sensitive data patterns detected' : '✅ No sensitive patterns detected'}
`;

writeFileSync(
  join(process.cwd(), 'security-audit-report.md'),
  humanReadableReport
);

console.log('\n📝 Reports saved:');
console.log('  - security-audit-report.json (machine-readable)');
console.log('  - security-audit-report.md (human-readable)');

console.log('\n🏁 Security audit completed!');
process.exit(results.exitCode);