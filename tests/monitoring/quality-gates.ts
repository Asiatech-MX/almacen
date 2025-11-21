export interface QualityGateMetrics {
  testCoverage: {
    percentage: number;
    threshold: number;
    passed: boolean;
  };
  contractTests: {
    total: number;
    passed: number;
    failed: number;
    passed: boolean;
  };
  performance: {
    baselineEstablished: boolean;
    regressionThreshold: number;
    passed: boolean;
  };
  typeConsistency: {
    inconsistenciesFound: number;
    criticalIssues: number;
    passed: boolean;
  };
}

export class QualityGates {
  private metrics: QualityGateMetrics;

  constructor() {
    this.metrics = {
      testCoverage: {
        percentage: 0,
        threshold: 80, // 80% coverage threshold
        passed: false,
      },
      contractTests: {
        total: 0,
        passed: 0,
        failed: 0,
        passed: false,
      },
      performance: {
        baselineEstablished: false,
        regressionThreshold: 5, // 5% performance degradation threshold
        passed: false,
      },
      typeConsistency: {
        inconsistenciesFound: 0,
        criticalIssues: 0,
        passed: false,
      },
    };
  }

  setTestCoverage(percentage: number): void {
    this.metrics.testCoverage.percentage = percentage;
    this.metrics.testCoverage.passed = percentage >= this.metrics.testCoverage.threshold;
  }

  setContractTestResults(total: number, passed: number, failed: number): void {
    this.metrics.contractTests.total = total;
    this.metrics.contractTests.passed = passed;
    this.metrics.contractTests.failed = failed;
    this.metrics.contractTests.passed = failed === 0 && total > 0;
  }

  setPerformanceBaseline(established: boolean, regressionPercent: number): void {
    this.metrics.performance.baselineEstablished = established;
    this.metrics.performance.passed = regressionPercent <= this.metrics.performance.regressionThreshold;
  }

  setTypeConsistency(inconsistencies: number, criticalIssues: number): void {
    this.metrics.typeConsistency.inconsistenciesFound = inconsistencies;
    this.metrics.typeConsistency.criticalIssues = criticalIssues;
    this.metrics.typeConsistency.passed = criticalIssues === 0;
  }

  getMetrics(): QualityGateMetrics {
    return this.metrics;
  }

  allGatesPassed(): boolean {
    return (
      this.metrics.testCoverage.passed &&
      this.metrics.contractTests.passed &&
      this.metrics.performance.passed &&
      this.metrics.typeConsistency.passed
    );
  }

  generateReport(): string {
    const report: string[] = [];
    report.push('# Quality Gates Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push(`Overall Status: ${this.allGatesPassed() ? '✅ PASSED' : '❌ FAILED'}`);
    report.push('');

    // Test Coverage Gate
    report.push('## 📊 Test Coverage Gate');
    report.push(`- Current: ${this.metrics.testCoverage.percentage.toFixed(1)}%`);
    report.push(`- Threshold: ${this.metrics.testCoverage.threshold}%`);
    report.push(`- Status: ${this.metrics.testCoverage.passed ? '✅ PASSED' : '❌ FAILED'}`);
    report.push('');

    // Contract Tests Gate
    report.push('## 🧪 Contract Tests Gate');
    report.push(`- Total Tests: ${this.metrics.contractTests.total}`);
    report.push(`- Passed: ${this.metrics.contractTests.passed}`);
    report.push(`- Failed: ${this.metrics.contractTests.failed}`);
    report.push(`- Status: ${this.metrics.contractTests.passed ? '✅ PASSED' : '❌ FAILED'}`);
    report.push('');

    // Performance Gate
    report.push('## ⚡ Performance Gate');
    report.push(`- Baseline Established: ${this.metrics.performance.baselineEstablished ? '✅' : '❌'}`);
    report.push(`- Regression Threshold: ${this.metrics.performance.regressionThreshold}%`);
    report.push(`- Status: ${this.metrics.performance.passed ? '✅ PASSED' : '❌ FAILED'}`);
    report.push('');

    // Type Consistency Gate
    report.push('## 🔍 Type Consistency Gate');
    report.push(`- Inconsistencies Found: ${this.metrics.typeConsistency.inconsistenciesFound}`);
    report.push(`- Critical Issues: ${this.metrics.typeConsistency.criticalIssues}`);
    report.push(`- Status: ${this.metrics.typeConsistency.passed ? '✅ PASSED' : '❌ FAILED'}`);
    report.push('');

    // Migration Readiness
    report.push('## 🚀 Migration Readiness Assessment');
    const readyGates = [
      this.metrics.testCoverage.passed,
      this.metrics.contractTests.passed,
      this.metrics.performance.passed,
      this.metrics.typeConsistency.passed,
    ].filter(Boolean).length;

    report.push(`- Gates Passed: ${readyGates}/4`);
    report.push(`- Migration Ready: ${this.allGatesPassed() ? '✅ YES' : '❌ NO'}`);

    if (!this.allGatesPassed()) {
      report.push('');
      report.push('### 🔧 Blockers to Address:');
      if (!this.metrics.testCoverage.passed) {
        report.push('- Increase test coverage to >= 80%');
      }
      if (!this.metrics.contractTests.passed) {
        report.push('- Fix failing contract tests');
      }
      if (!this.metrics.performance.passed) {
        report.push('- Optimize performance to meet baseline');
      }
      if (!this.metrics.typeConsistency.passed) {
        report.push('- Resolve critical type consistency issues');
      }
    }

    return report.join('\n');
  }

  exportToJSON(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      overallStatus: this.allGatesPassed() ? 'PASSED' : 'FAILED',
      gatesPassed: [
        this.metrics.testCoverage.passed,
        this.metrics.contractTests.passed,
        this.metrics.performance.passed,
        this.metrics.typeConsistency.passed,
      ].filter(Boolean).length,
      totalGates: 4,
      metrics: this.metrics,
    }, null, 2);
  }

  // Check if Phase 1 is complete and ready for Phase 2
  isPhase1Complete(): boolean {
    return (
      this.metrics.testCoverage.passed &&
      this.metrics.contractTests.passed &&
      this.metrics.performance.baselineEstablished
    );
  }

  // Get migration readiness score (0-100)
  getReadinessScore(): number {
    const weights = {
      testCoverage: 25,
      contractTests: 25,
      performance: 25,
      typeConsistency: 25,
    };

    let score = 0;
    if (this.metrics.testCoverage.passed) score += weights.testCoverage;
    if (this.metrics.contractTests.passed) score += weights.contractTests;
    if (this.metrics.performance.passed) score += weights.performance;
    if (this.metrics.typeConsistency.passed) score += weights.typeConsistency;

    return score;
  }
}