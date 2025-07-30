import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation, BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { ProjectProvider } from '../../../contexts/ProjectsContext';
import { OrganizationsProvider } from '../../../contexts/OrganizationsContext';
import { UserAuth } from '../../../contexts/UserAuth';
import OrganizationsIndex from '../OrganizationsIndex';
import OrganizationDetail from '../OrganizationDetail';
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
    const mod = await vi.importActual('react-router-dom');
    return {
        ...mod,
        useNavigate: () => navigateMock,
    };
});
console.log(navigateMock.mock.calls);
const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function LocationDisplay() {
            const location = useLocation();
            return <div data-testid="location-display">{location.pathname}</div>;
        }
const renderWithContext = () => {
    const mockUser = { username:'test', role: 'admin', organization_id: 1 };
    return render(
            <MemoryRouter initialEntries={['/organizations']}>
            <ProjectProvider>
            <OrganizationsProvider>
                <UserAuth value={{ user: mockUser }}>
                <Routes>
                    <Route path="/organizations" element={<OrganizationsIndex />} />
                    <Route path="/organizations/:id" element={<OrganizationDetail />} />
                </Routes>
                <LocationDisplay />
                </UserAuth>
            </OrganizationsProvider>
            </ProjectProvider>
            </MemoryRouter>
        );
};

describe('OrganizationIndex', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders list after loading', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/health org botswana/i)).toBeInTheDocument();
            expect(screen.getByText(/jr health org/i)).toBeInTheDocument();
        });
    });

    it('shows organization detail on click', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/health org botswana/i)).toBeInTheDocument();
        });
        const title = screen.getByText(/health org botswana/i); 
        const clickableDiv = title.closest('._card_615346');
        //if (!clickableDiv) throw new Error('Clickable div not found');
        userEvent.click(clickableDiv);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText(/JR Health Org BW/i)).toBeInTheDocument();
        });
    });
    
    it('goes to detail page on click', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/health org botswana/i)).toBeInTheDocument();
        });
        // Wait for link to appear and click it
        const link = await screen.findByRole('link', { name: /health org botswana/i });
        await userEvent.click(link);

        await waitFor(() => {
            expect(screen.getByTestId('location-display')).toHaveTextContent('/organizations/1');
        });
    });
});