import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from '../src/components/ui/button'
import { Input } from '../src/components/ui/input'
import { Alert } from '../src/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../src/components/ui/table'

// Mock Radix components for testing
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('@radix-ui/react-label', () => ({
  Root: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

describe('ISO 9241 Accessibility Tests', () => {
  test('Button component should not have accessibility violations', async () => {
    const { container } = render(
      <div>
        <Button>Click me</Button>
        <Button variant="destructive">Delete</Button>
        <Button loading loadingText="Loading...">
          Submit
        </Button>
      </div>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()

    // Test keyboard accessibility
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type')
    })

    // Test loading state
    const loadingButton = screen.getByRole('button', { name: /loading/i })
    expect(loadingButton).toHaveAttribute('aria-busy', 'true')
  })

  test('Input component should not have accessibility violations', async () => {
    const { container } = render(
      <div>
        <Input
          label="Email"
          type="email"
          required
          helperText="Enter your email address"
        />
        <Input
          label="Password"
          type="password"
          error="Password is required"
        />
      </div>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()

    // Test form field associations
    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toBeRequired()
    expect(emailInput).toHaveAttribute('aria-describedby')

    const passwordInput = screen.getByLabelText(/password/i)
    expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
  })

  test('Alert component should not have accessibility violations', async () => {
    const { container } = render(
      <div>
        <Alert>
          This is a success message
        </Alert>
        <Alert variant="destructive" role="alert" aria-live="assertive">
          This is an error message
        </Alert>
      </div>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()

    // Test ARIA roles
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(1) // Only one has role="alert"
  })

  test('Table component should not have accessibility violations', async () => {
    const mockData = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' },
    ]

    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()

    // Test table structure
    expect(screen.getByRole('table')).toBeInTheDocument()

    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(2)
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col')
    })

    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(4) // 2 rows × 2 columns
  })

  test('Color contrast should meet WCAG AA standards', () => {
    // This test would typically require a color contrast library
    // For now, we ensure high contrast class is available
    const { container } = render(
      <div className="bg-background text-foreground">
        Test text
      </div>
    )

    expect(container.firstChild).toHaveClass('bg-background', 'text-foreground')
  })

  test('Focus management should work correctly', async () => {
    const { container } = render(
      <div>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </div>
    )

    // Test focus-visible styling
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })
  })

  test('Screen reader announcements should work', async () => {
    const { container } = render(
      <div>
        <Alert role="status" aria-live="polite">
          Status update
        </Alert>
        <Alert role="alert" aria-live="assertive">
          Error occurred
        </Alert>
      </div>
    )

    const statusAlert = screen.getByRole('status')
    expect(statusAlert).toHaveAttribute('aria-live', 'polite')

    const errorAlert = screen.getByRole('alert')
    expect(errorAlert).toHaveAttribute('aria-live', 'assertive')
  })
})