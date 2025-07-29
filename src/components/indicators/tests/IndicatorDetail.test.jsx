import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserAuth } from '../../../contexts/UserAuth';
import { IndicatorsProvider } from '../../../contexts/IndicatorsContext';
import IndicatorDetail from '../IndicatorDetail';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

export const renderWithProviders = ({ id = '1', user = { role: 'admin' } } = {}) => {
    return render(
        <UserAuth value={{ user }}>
            <IndicatorsProvider>
                <MemoryRouter initialEntries={[`/indicators/${id}`]}>
                    <Routes>
                        <Route path="/indicators/:id" element={<IndicatorDetail />} />
                    </Routes>
                </MemoryRouter>
            </IndicatorsProvider>
        </UserAuth>
    );
};

describe('IndicatorDetail', () => {
    it('renders indicator info after loading', async () => {
        renderWithProviders();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() =>
        expect(screen.getByText(/return to indicators overview/i)).toBeInTheDocument()
        );

        expect(screen.getByRole('heading', { name: /HIV-TEST/i })).toBeInTheDocument();
    });

    it('switches to edit mode on Edit Details click', async () => {
        renderWithProviders();

        await screen.findByText(/edit details/i);

        const editButton = screen.getByText(/edit details/i);
        expect(editButton.closest('a')).toHaveAttribute('href', '/indicators/1/edit');
    });

    it('shows confirm delete modal when delete clicked', async () => {
        renderWithProviders();

        const deleteBtn = await screen.findByText(/delete/i);
        fireEvent.click(deleteBtn);

        expect(await screen.findByText(/please type "confirm" to delete/i)).toBeInTheDocument();
    });
});
