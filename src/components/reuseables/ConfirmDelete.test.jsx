import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmDelete from './ConfirmDelete';

describe('ConfirmDelete', () => {
  const name = 'Test Item';
  const statusWarning = 'Warning: linked data will be affected.';
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with required text and disables Confirm initially', () => {
        render(<ConfirmDelete name={name} onConfirm={onConfirm} onCancel={onCancel} />);
        expect(screen.getByText(`You are about to delete ${name}`)).toBeInTheDocument();
        expect(screen.getByText(/please be absolutely sure/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/please type "confirm" to delete/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeEnabled();
    });

    it('shows status warning if provided', () => {
        render(<ConfirmDelete name={name} onConfirm={onConfirm} onCancel={onCancel} statusWarning={statusWarning} />);
        expect(screen.getByText(statusWarning)).toBeInTheDocument();
    });

    it('enables Confirm button when typing "confirm"', () => {
        render(<ConfirmDelete name={name} onConfirm={onConfirm} onCancel={onCancel} />);
        const input = screen.getByLabelText(/please type "confirm" to delete/i);
        const confirmBtn = screen.getByRole('button', { name: /confirm/i });

        fireEvent.change(input, { target: { value: 'not correct' } });
        expect(confirmBtn).toBeDisabled();

        fireEvent.change(input, { target: { value: 'confirm' } });
        expect(confirmBtn).toBeEnabled();
    });

    it('Confirm button is enabled immediately if allowEasy is true', () => {
        render(<ConfirmDelete name={name} onConfirm={onConfirm} onCancel={onCancel} allowEasy={true} />);
        const confirmBtn = screen.getByRole('button', { name: /confirm/i });
        expect(confirmBtn).toBeEnabled();
        expect(screen.queryByLabelText(/please type "confirm" to delete/i)).not.toBeInTheDocument();
    });

    it('calls onConfirm when Confirm button clicked', () => {
        render(<ConfirmDelete name={name} onConfirm={onConfirm} onCancel={onCancel} allowEasy={true} />);
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
        expect(onConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when Cancel button clicked', () => {
        render(<ConfirmDelete name={name} onConfirm={onConfirm} onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onCancel).toHaveBeenCalled();
    });
});