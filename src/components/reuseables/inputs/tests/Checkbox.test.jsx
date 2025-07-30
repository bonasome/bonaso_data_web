import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Checkbox from '../Checkbox';

describe('Checkbox', () => {
    it('renders with label and unchecked by default', () => {
        render(<Checkbox name="test-check" label="Check me" />);
        const checkbox = screen.getByLabelText(/check me/i);
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).not.toBeChecked();
    });

    it('respects the checked prop', () => {
        render(<Checkbox name="test-check" label="Check me" checked={true} />);
        const checkbox = screen.getByLabelText(/check me/i);
        expect(checkbox).toBeChecked();
    });

    it('calls callback when clicked', () => {
        const mockCallback = vi.fn();
        render(<Checkbox name="test-check" label="Check me" callback={mockCallback} />);
        const checkbox = screen.getByLabelText(/check me/i);
        fireEvent.click(checkbox);
        expect(mockCallback).toHaveBeenCalledWith(true);
    });

    it('toggles off and on when clicked multiple times (controlled)', () => {
        const mockCallback = vi.fn();
        const ControlledWrapper = () => {
        const [val, setVal] = React.useState(false);
        return <Checkbox name="check" label="Test" checked={val} callback={setVal} />;
        };
        render(<ControlledWrapper />);
        const checkbox = screen.getByLabelText(/test/i);

        // Click to check
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();

        // Click to uncheck
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });
});