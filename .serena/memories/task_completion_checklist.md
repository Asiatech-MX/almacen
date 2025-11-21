# Task Completion Checklist

## Pre-Commit Requirements
- [ ] **Code Quality**: Run `pnpm --filter electron-renderer lint` - no warnings/errors
- [ ] **Type Checking**: No TypeScript errors in IDE or build
- [ ] **Tests Pass**: `pnpm test` - all tests passing
- [ ] **Accessibility**: `pnpm --filter electron-renderer test:accessibility` - pass if UI changes
- [ ] **Build Success**: `pnpm build` - builds without errors

## Code Review Checklist
- [ ] **Naming**: Follows PascalCase/camelCase conventions
- [ ] **Type Safety**: All variables properly typed
- [ ] **Error Handling**: Appropriate error handling and user messages
- [ ] **Security**: No hardcoded secrets, proper validation
- [ ] **Performance**: No obvious performance issues
- [ ] **Documentation**: Code comments where necessary

## Backend Specific
- [ ] **Database**: Kysely queries are type-safe and efficient
- [ ] **Transactions**: Proper transaction handling for multi-step operations
- [ ] **Validation**: Zod schemas for input validation
- [ ] **Audit Trail**: Proper audit logging for CRUD operations
- [ ] **Error Messages**: Clear, user-friendly error messages in Spanish

## Frontend Specific
- [ ] **Components**: Follow Radix UI + Tailwind patterns
- [ ] **State Management**: Proper React Query usage for server state
- [ ] **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- [ ] **Responsive**: Works on different screen sizes
- [ ] **User Experience**: Loading states, error states, success feedback

## Testing Requirements
- [ ] **Unit Tests**: Cover business logic and edge cases
- [ ] **Integration Tests**: Test component interactions and data flow
- [ ] **Contract Tests**: Validate API contracts between frontend/backend
- [ ] **Accessibility Tests**: jest-axe checks for new UI components
- [ ] **Coverage**: Maintain good test coverage on critical paths

## Documentation
- [ ] **README**: Update if significant changes
- [ ] **Comments**: Add comments for complex logic
- [ ] **Changelog**: Document breaking changes or new features
- [ ] **Memory Files**: Update Serena memory files if patterns change

## Final Verification
- [ ] **Manual Testing**: Test the feature manually in the Electron app
- [ ] **Cross-Platform**: Verify works on Windows (target platform)
- [ ] **Database**: Verify database changes work correctly
- [ ] **No Regressions**: Existing functionality still works
- [ ] **Clean Up**: Remove console.log, temporary files, unused imports

## Release Preparation (if applicable)
- [ ] **Version**: Update version numbers if needed
- [ ] **Changelog**: Prepare release notes
- [ ] **Tagging**: Create git tag for release
- [ ] **Distribution**: Test `pnpm dist` creates proper package