import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disables button when loading', () => {
    const onClick = jest.fn();
    render(<Button loading onClick={onClick}>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('forwards ref to button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('passes through additional props', () => {
    render(<Button data-testid="button">Button</Button>);
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });
});