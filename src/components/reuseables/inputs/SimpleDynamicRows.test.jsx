import React, { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SimpleDynamicRows from './SimpleDynamicRows';

function TestWrapper({ existing = [] }) {
    const ref = useRef();
    return (
        <div>
        <SimpleDynamicRows ref={ref} label="Test Rows" existing={existing} />
        <button onClick={() => {
            const result = ref.current?.collect();
            // for testing output
            if (result) window.__COLLECTED__ = result;
        }}>Collect</button>
        </div>
    );
}

describe('SimpleDynamicRows', () => {

    it('renders an initial row with input', () => {
        render(<TestWrapper />);
        expect(screen.getByLabelText('1.')).toBeInTheDocument();
    });

    it('adds a new row when "Add Row" is clicked', () => {
        render(<TestWrapper />);
        fireEvent.click(screen.getByText('Add Row'));
        expect(screen.getByLabelText('2.')).toBeInTheDocument();
    });

    it('removes a row when "Remove" is clicked', () => {
        render(<TestWrapper />);
        fireEvent.click(screen.getByText('Add Row')); // Now we have 2 rows

        let inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBe(2); // Confirm 2 inputs

        const removeButtons = screen.getAllByText('Remove');
        fireEvent.click(removeButtons[0]); // Remove the first row

        inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBe(1); // Should only be one left
    });

    it('disables remove button when only one row exists', () => {
        render(<TestWrapper />);
        const removeButton = screen.getByText('Remove');
        expect(removeButton).toBeDisabled();
    });

    it('calls collect and returns values', () => {
        render(<TestWrapper />);
        const input = screen.getByLabelText('1.');
        fireEvent.change(input, { target: { value: 'Row Value' } });

        fireEvent.click(screen.getByText('Collect'));
        expect(window.__COLLECTED__).toEqual(['Row Value']);
    });

    it('shows error if a row is blank on collect', () => {
        render(<TestWrapper />);
        fireEvent.click(screen.getByText('Collect'));
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/is invalid/)).toBeInTheDocument();
    });

    it('loads existing values if provided', () => {
        render(<TestWrapper existing={['apple', 'banana']} />);
        expect(screen.getByDisplayValue('apple')).toBeInTheDocument();
        expect(screen.getByDisplayValue('banana')).toBeInTheDocument();
    });

});