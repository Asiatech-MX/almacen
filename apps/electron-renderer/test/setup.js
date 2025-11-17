import '@testing-library/jest-dom'
import { configure, toHaveNoViolations } from 'jest-axe'

// Configure jest-axe
expect.extend(toHaveNoViolations)

// Configure Testing Library
configure({
  testIdAttribute: 'data-testid',
})