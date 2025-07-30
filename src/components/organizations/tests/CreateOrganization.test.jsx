import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { OrganizationsProvider } from '../../../contexts/OrganizationsContext';
import { UserAuth } from '../../../contexts/UserAuth';
import CreateOrganization from '../CreateOrganization';

import userEvent from '@testing-library/user-event';;
const user = userEvent.setup();

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
    const mockUser = { organization_id: 10 }; // Org A
    return render(
        <UserAuth value={{ user: mockUser }}>
            <BrowserRouter>
                <OrganizationsProvider>
                    <CreateOrganization />
                </OrganizationsProvider>
            </BrowserRouter>
        </UserAuth>
    );
};

describe('CreateOrganization', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
        renderWithContext();
        await screen.findByText(/New Organization/i);
        expect(screen.getByRole('heading', { name: /new organization/i })).toBeInTheDocument();
    });

    it('submits valid data and navigates', async () => {
        renderWithContext();
        await screen.findByText(/New Organization/i);

        const nameInput = screen.getByLabelText(/organization name/i); 
        await user.type(nameInput, 'New Org X');

        
        const submit = screen.getByRole('button', { name: /save/i }); 
        fireEvent.click(submit);
        //citizenship should default rendering this ok
        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/organizations/99');
        });
    });

    it('shows error message when submission fails', async () => {
        renderWithContext();
        await screen.findByText(/New Organization/i);

        const submit = screen.getByRole('button', { name: /save/i });
        fireEvent.click(submit);

        await screen.findByText(/name is required./i);
    });
});