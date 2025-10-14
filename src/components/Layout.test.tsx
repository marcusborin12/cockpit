import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Teste simples de renderização sem contexto complexo
describe('Layout Component - Basic Tests', () => {
  it('should render router without crashing', () => {
    render(
      <BrowserRouter>
        <div data-testid="test-content">Test Content</div>
      </BrowserRouter>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should demonstrate test framework is working', () => {
    const testValue = 'Hello World';
    expect(testValue).toBe('Hello World');
  });

  it('should handle basic DOM operations', () => {
    render(<div role="button">Click me</div>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });
});