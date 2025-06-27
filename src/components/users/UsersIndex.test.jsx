import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation, BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../mocks/handlers';
import { UserAuth } from '../../contexts/UserAuth';
import UsersIndex from './UsersIndex';
import Profile from './Profile';
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
    const mockUser = { username:'test', role: 'admin', profile_id: 1 };
    return render(
            <MemoryRouter initialEntries={['/profiles']}>
                <UserAuth value={{ user: mockUser }}>
                <Routes>
                    <Route path="/profiles" element={<UsersIndex />} />
                    <Route path="/profiles/:id" element={<Profile />} />
                </Routes>
                <LocationDisplay />
                </UserAuth>
            </MemoryRouter>
        );
};

describe('UserIndex', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders list after loading', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/user wun/i)).toBeInTheDocument();
            expect(screen.getByText(/user tu/i)).toBeInTheDocument();
        });
    });

    it('shows profile detail on click', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/user wun/i)).toBeInTheDocument();
        });
        const title = screen.getByText(/user wun/i); 
        const clickableDiv = title.closest('._card_615346');
        //if (!clickableDiv) throw new Error('Clickable div not found');
        userEvent.click(clickableDiv);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText(/health org botswana/i)).toBeInTheDocument();
        });
    });
    
    it('goes to detail page on click', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/user wun/i)).toBeInTheDocument();
        });
        // Wait for link to appear and click it
        const link = await screen.findByRole('link', { name: /user wun/i });
        await userEvent.click(link);

        await waitFor(() => {
            expect(screen.getByTestId('location-display')).toHaveTextContent('/profiles/1');
        });
    });
});