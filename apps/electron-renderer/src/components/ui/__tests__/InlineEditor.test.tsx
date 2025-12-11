import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InlineEditor from '../InlineEditor';

// Mock implementations
vi.mock('@/hooks/useInlineEditor', () => ({
  useInlineEditor: vi.fn(() => ({
    isEditing: false,
    editingValue: null,
    originalValue: null,
    loading: false,
    error: null,
    hasChanges: false,
    startEditing: vi.fn(),
    cancelEditing: vi.fn(),
    saveEditing: vi.fn(),
    updateValue: vi.fn(),
    setEditing: vi.fn(),
    clearError: vi.fn(),
    inputRef: { current: null }
  }))
}));

describe('InlineEditor', () => {
  const mockValue = {
    id: '1',
    nombre: 'Test Categoria',
    descripcion: 'Test description'
  };

  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in display mode by default', () => {
    render(
      <InlineEditor
        value={mockValue}
        onSave={mockOnSave}
        type="categoria"
      />
    );

    expect(screen.getByText('Test Categoria')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('shows edit icon on hover', () => {
    render(
      <InlineEditor
        value={mockValue}
        onSave={mockOnSave}
        type="categoria"
      />
    );

    const container = screen.getByText('Test Categoria').closest('div');
    fireEvent.mouseEnter(container!);

    // The edit icon should be visible
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    vi.doMock('@/hooks/useInlineEditor', () => ({
      useInlineEditor: vi.fn(() => ({
        isEditing: false,
        editingValue: null,
        originalValue: null,
        loading: true,
        error: null,
        hasChanges: false,
        startEditing: vi.fn(),
        cancelEditing: vi.fn(),
        saveEditing: vi.fn(),
        updateValue: vi.fn(),
        setEditing: vi.fn(),
        clearError: vi.fn(),
        inputRef: { current: null }
      }))
    }));

    render(
      <InlineEditor
        value={mockValue}
        onSave={mockOnSave}
        type="categoria"
      />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error message when error is present', () => {
    vi.doMock('@/hooks/useInlineEditor', () => ({
      useInlineEditor: vi.fn(() => ({
        isEditing: false,
        editingValue: null,
        originalValue: null,
        loading: false,
        error: 'Test error message',
        hasChanges: false,
        startEditing: vi.fn(),
        cancelEditing: vi.fn(),
        saveEditing: vi.fn(),
        updateValue: vi.fn(),
        setEditing: vi.fn(),
        clearError: vi.fn(),
        inputRef: { current: null }
      }))
    }));

    render(
      <InlineEditor
        value={mockValue}
        onSave={mockOnSave}
        type="categoria"
      />
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });
});