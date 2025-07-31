import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateClient from '../clients/CreateClientModal';

// Mock fetchWithAuth
vi.mock('../../../services/fetchWithAuth', () => {
    return {
        default: vi.fn(),
    };
});
import fetchWithAuth from '../../../../services/fetchWithAuth';

describe('CreateClient', () => {
    const onCreate = vi.fn();
    const onCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders inputs and buttons', () => {
        render(<CreateClient onCreate={onCreate} onCancel={onCancel} />);
        expect(screen.getByLabelText(/enter a name/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows validation error if name is empty', async () => {
        render(<CreateClient onCreate={onCreate} onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(await screen.findByText(/client name is required/i)).toBeInTheDocument();
    });

    it('calls onCreate on successful submit', async () => {
        fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
        });

        render(<CreateClient onCreate={onCreate} onCancel={onCancel} />);
        fireEvent.change(screen.getByLabelText(/enter a name/i), { target: { value: 'Test Client' } });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith(123, 'Test Client');
        });
    });

    it('shows server errors when response is not ok', async () => {
        fetchWithAuth.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ name: ['Name already exists'] }),
        });

        render(<CreateClient onCreate={onCreate} onCancel={onCancel} />);
        fireEvent.change(screen.getByLabelText(/enter a name/i), { target: { value: 'Duplicate' } });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(await screen.findByText(/name: name already exists/i)).toBeInTheDocument();
        expect(onCreate).not.toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', () => {
        render(<CreateClient onCreate={onCreate} onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onCancel).toHaveBeenCalled();
    });
});