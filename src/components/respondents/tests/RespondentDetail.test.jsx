import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserAuth } from '../../../contexts/UserAuth';
import { RespondentsProvider } from '../../../contexts/RespondentsContext';
import RespondentDetail from '../RespondentDetail';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InteractionsProvider } from '../../../contexts/InteractionsContext';

export const renderWithProviders = ({ id = '1', user = { role: 'admin' } } = {}) => {
    return render(
        <UserAuth value={{ user }}>
            <RespondentsProvider>
                <InteractionsProvider>
                <MemoryRouter initialEntries={[`/respondents/${id}`]}>
                    <Routes>
                        <Route path="/respondents/:id" element={<RespondentDetail />} />
                    </Routes>
                </MemoryRouter>
                </InteractionsProvider>
            </RespondentsProvider>
        </UserAuth>
    );
};

describe('RespondentDetail', () => {
    it('renders respondent info after loading', async () => {
        renderWithProviders();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() =>
        expect(screen.getByText(/return to respondents overview/i)).toBeInTheDocument()
        );

        expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument();
    });

    it('switches to edit mode on Edit Details click', async () => {
        renderWithProviders();

        await screen.findByText(/edit details/i);

        const editButton = screen.getByText(/edit details/i);
        expect(editButton.closest('a')).toHaveAttribute('href', '/respondents/1/edit');
    });
    it('show sensitive info on click', async () => {
        renderWithProviders();

        await screen.findByText(/edit details/i);

        const viewButton = screen.getByText(/view more/i);
        fireEvent.click(viewButton);
        await screen.findByText(/FSW/i);
    });

    it('shows confirm delete modal when delete clicked', async () => {
        renderWithProviders();

        const deleteBtn = await screen.findByText(/delete/i);
        fireEvent.click(deleteBtn);

        expect(await screen.findByText(/please type "confirm" to delete/i)).toBeInTheDocument();
    });
    it('renders child componenets', async () => {
        renderWithProviders();

        expect(await screen.findByText(/new interaction/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /tasks/i })).toBeInTheDocument();
        expect(await screen.findByText(/previous interactions/i)).toBeInTheDocument();
    });
});
