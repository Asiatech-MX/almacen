import { test, expect } from '@playwright/test';

test.describe('Simple Test', () => {
  test('should run a simple test', () => {
    expect(1 + 1).toBe(2);
  });
});