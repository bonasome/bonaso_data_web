import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { OrganizationsProvider } from '../../../contexts/OrganizationsContext';
import { UserAuth } from '../../../contexts/UserAuth';
import EditOrganization from '../EditOrganization';
import OrganizationDetail from '../OrganizationDetail';
import userEvent from '@testing-library/user-event';;

const navigateMock = vi.fn();
    vi.mock('react-router-dom', async () => {
      const mod = await vi.importActual('react-router-dom');
      return {
        ...mod,
        useNavigate: () => navigateMock,
      };
    });

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());



const renderWithContext = () => {
    const mockUser = { organization_id: 10 };

    return render(
        <UserAuth value={{ user: mockUser }}>
            <MemoryRouter initialEntries={['/organizations/1/edit']}>
                <OrganizationsProvider>
                    <Routes>
                        <Route path="/organizations/:id/edit" element={<EditOrganization />} />
                        <Route path="/organizations/:id" element={<OrganizationDetail />} />
                    </Routes>
                </OrganizationsProvider>
            </MemoryRouter>
        </UserAuth>
    );
};

describe('EditOrganization', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
        renderWithContext();
        await screen.findByText(/editing details/i);

        await waitFor(() => {
            expect(screen.getByLabelText(/organization name/i).value).toBe('Health Org Botswana');
        });

    });

    it('submits edits and navigates to detail page', async () => {
        renderWithContext();
        await screen.findByText(/editing details/i);

        const fullInput = await screen.findByLabelText(/full name/i);
        await userEvent.type(fullInput, 'The Health Organization of Botswana');

        const submit = screen.getByRole('button', { name: /save/i });
        await userEvent.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/organizations/1');
        });
    });
});