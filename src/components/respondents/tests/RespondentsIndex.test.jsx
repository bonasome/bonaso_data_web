import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation, BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { RespondentsProvider } from '../../../contexts/RespondentsContext';
import { UserAuth } from '../../../contexts/UserAuth';
import RespondentsIndex from '../RespondentsIndex';
import RespondentDetail from '../RespondentDetail';
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
    const mockUser = { username:'test', role: 'admin', respondents_id: 1 };
    return render(
            <MemoryRouter initialEntries={['/respondentss']}>
            <RespondentsProvider>
                <UserAuth value={{ user: mockUser }}>
                <Routes>
                    <Route path="/respondentss" element={<RespondentsIndex />} />
                    <Route path="/respondentss/:id" element={<RespondentDetail />} />
                </Routes>
                <LocationDisplay />
                </UserAuth>
            </RespondentsProvider>
            </MemoryRouter>
        );
};

describe('RespondentIndex', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders list after loading', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/john doe/i)).toBeInTheDocument();
            expect(screen.getByText(/jane doe/i)).toBeInTheDocument();
        });
    });

    it('shows respondents detail on click', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/john doe/i)).toBeInTheDocument();
        });
        const title = screen.getByText(/john doe/i); 
        const clickableDiv = title.closest('._card_615346');
        //if (!clickableDiv) throw new Error('Clickable div not found');
        userEvent.click(clickableDiv);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText(/male/i)).toBeInTheDocument();
        });
    });
    
    it('goes to detail page on click', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/john doe/i)).toBeInTheDocument();
        });
        const link = await screen.findByRole('link', { name: /john doe/i });
        await userEvent.click(link);

        await waitFor(() => {
            expect(screen.getByTestId('location-display')).toHaveTextContent('/respondents/1');
        });
    });
});