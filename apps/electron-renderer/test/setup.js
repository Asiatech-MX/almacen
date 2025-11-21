// Polyfill for TextEncoder/TextDecoder in Jest environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

require('@testing-library/jest-dom')
const { toHaveNoViolations } = require('jest-axe')
const { configure } = require('@testing-library/dom')

// Configure jest-axe
expect.extend(toHaveNoViolations)

// Configure Testing Library
configure({
  testIdAttribute: 'data-testid',
})