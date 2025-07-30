import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserAuth } from '../../../contexts/UserAuth';
import { OrganizationsProvider } from '../../../contexts/OrganizationsContext';
import OrganizationDetail from '../OrganizationDetail';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

export const renderWithProviders = ({ id = '1', user = { role: 'admin' } } = {}) => {
    return render(
        <UserAuth value={{ user }}>
            <OrganizationsProvider>
                <MemoryRouter initialEntries={[`/organizations/${id}`]}>
                    <Routes>
                        <Route path="/organizations/:id" element={<OrganizationDetail />} />
                    </Routes>
                </MemoryRouter>
            </OrganizationsProvider>
        </UserAuth>
    );
};

describe('OrganizationDetail', () => {
    it('renders organization info after loading', async () => {
        renderWithProviders();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() =>
        expect(screen.getByText(/return to organizations overview/i)).toBeInTheDocument()
        );

        expect(screen.getByRole('heading', { name: /Health Org Botswana/i })).toBeInTheDocument();
    });

    it('switches to edit mode on Edit Details click', async () => {
        renderWithProviders();

        await screen.findByText(/edit details/i);

        const editButton = screen.getByText(/edit details/i);
        expect(editButton.closest('a')).toHaveAttribute('href', '/organizations/1/edit');
    });

    it('shows confirm delete modal when delete clicked', async () => {
        renderWithProviders();

        const deleteBtn = await screen.findByText(/delete/i);
        fireEvent.click(deleteBtn);

        expect(await screen.findByText(/please type "confirm" to delete/i)).toBeInTheDocument();
    });
    it('shows child orgs', async () => {
        renderWithProviders();

        const deleteBtn = await screen.findByText(/delete/i);
        fireEvent.click(deleteBtn);

        expect(await screen.findByText(/JR Health Org BW/i)).toBeInTheDocument();
    });
});
