import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
//mock validate
vi.mock('../../../services/validate', () => ({
  default: (input) => {
    console.log('validate called with:', input.name, input.value);
    if (input.name === 'email' && !input.value.includes('@')) {
        return ['Invalid email address'];
    }
    return [];
    }
}));

import DynamicForm from './DynamicForm';

// Mock SimpleSelect if needed
vi.mock('./SimpleSelect', () => ({
    default: ({ name, label, optionValues, optionLabels, multiple, callback }) => (
        <div>
        <label htmlFor={name}>{label}</label>
        <select
        id={name}
            data-testid={name}
            name={name}
            multiple={multiple}
            onChange={(e) => callback(e.target.value)}
        >
            {optionValues.map((val, i) => (
            <option key={val} value={val}>
                {optionLabels[i]}
            </option>
            ))}
        </select>
        </div>
    )
}));

const baseConfig = [
    { type: 'text', name: 'username', label: 'Username', required: true },
    { type: 'email', name: 'email', label: 'Email', required: true },
    { type: 'number', name: 'age', label: 'Age', required: false },
    { type: 'checkbox', name: 'subscribe', label: 'Subscribe', switchpath: true },
    { type: 'textarea', name: 'bio', label: 'Biography', required: false },
    {
        type: 'select',
        name: 'gender',
        label: 'Gender',
        required: false,
        constructors: {
            values: ['male', 'female', 'other'],
            labels: ['Male', 'Female', 'Other'],
            multiple: false,
        },
    },
];

describe('DynamicForm', () => {
  it('renders fields based on config', () => {
    render(<DynamicForm config={baseConfig} onSubmit={() => {}} />);

    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subscribe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Biography/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument();
  });

  it('submits correct data', async () => {
    const mockSubmit = vi.fn();
    render(<DynamicForm config={baseConfig} onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'john_doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: 30 } });
    fireEvent.change(screen.getByLabelText(/Biography/i), { target: { value: 'Test bio' } });

    fireEvent.change(screen.getByTestId('gender'), {
      target: { value: 'male' }
    });

    fireEvent.click(screen.getByLabelText(/Subscribe/i));

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        username: 'john_doe',
        email: 'john@example.com',
        age: '30',
        bio: 'Test bio',
        subscribe: true,
        gender: 'male',
      });
    });
  });

  it('shows validation errors when fields are invalid', async () => {
        const mockSubmit = vi.fn();
        render(<DynamicForm config={baseConfig} onSubmit={mockSubmit} />);

        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'john_doe' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'johxample.com' } });
        fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: 'b' } });
        fireEvent.change(screen.getByLabelText(/Biography/i), { target: { value: 'Test bio' } });

        fireEvent.change(screen.getByTestId('gender'), {
        target: { value: 'male' }
        });

        fireEvent.click(screen.getByLabelText(/Subscribe/i));

        fireEvent.click(screen.getByRole('button', { name: /Save/i }));

        await waitFor(() => {
            const alert = screen.getByRole('alert');
            console.log('Error alert:', alert.textContent);
            expect(alert).toBeInTheDocument();
        });

    expect(mockSubmit).not.toHaveBeenCalled();
  });
});