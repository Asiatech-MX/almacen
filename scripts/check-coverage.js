#!/usr/bin/env node

/**
 * Coverage verification script
 * Reads Jest coverage report and ensures coverage thresholds are met
 */

const fs = require('fs');
const path = require('path');

const TARGET_COVERAGE = 90;
const COVERAGE_FILE = path.resolve(__dirname, '../coverage/coverage-summary.json');

function checkCoverage() {
  console.log('🔍 Verifying coverage thresholds...');

  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error('❌ Coverage file not found. Run "npm run test:coverage" first.');
    process.exit(1);
  }

  try {
    const coverageData = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
    const { total } = coverageData;

    console.log('📊 Coverage Results:');
    console.log(`  Lines: ${total.lines.pct}%`);
    console.log(`  Functions: ${total.functions.pct}%`);
    console.log(`  Branches: ${total.branches.pct}%`);
    console.log(`  Statements: ${total.statements.pct}%`);

    const metrics = [
      { name: 'Lines', value: total.lines.pct },
      { name: 'Functions', value: total.functions.pct },
      { name: 'Branches', value: total.branches.pct },
      { name: 'Statements', value: total.statements.pct }
    ];

    const failedMetrics = metrics.filter(metric => metric.value < TARGET_COVERAGE);

    if (failedMetrics.length === 0) {
      console.log(`✅ All coverage metrics meet the ${TARGET_COVERAGE}% target!`);
      process.exit(0);
    } else {
      console.log(`❌ Coverage thresholds not met (${TARGET_COVERAGE}% required):`);
      failedMetrics.forEach(metric => {
        console.log(`  ${metric.name}: ${metric.value}% (needs ${TARGET_COVERAGE}%)`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error reading coverage file:', error.message);
    process.exit(1);
  }
}

checkCoverage();