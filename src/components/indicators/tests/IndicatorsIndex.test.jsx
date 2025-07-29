import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation, BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { IndicatorsProvider } from '../../../contexts/IndicatorsContext';
import { UserAuth } from '../../../contexts/UserAuth';
import IndicatorsIndex from '../IndicatorsIndex';
import IndicatorDetail from '../IndicatorDetail';
import { ProjectProvider } from '../../../contexts/ProjectsContext';
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

const renderWithContext = () => {
    const mockUser = { username:'test', role: 'admin', organization_id: 1 };
    return render(
        <UserAuth value={{ user: mockUser }}>
            <BrowserRouter>
                <IndicatorsProvider>
                    <ProjectProvider >
                        <IndicatorsIndex />
                    </ProjectProvider>
                </IndicatorsProvider>
            </BrowserRouter>
        </UserAuth>
    );
};

describe('IndicatorIndex', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders list after loading', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/hiv-test/i)).toBeInTheDocument();
            expect(screen.getByText(/hiv-tp/i)).toBeInTheDocument();
            expect(screen.getByText(/hiv-msg/i)).toBeInTheDocument();
            expect(screen.getByText(/hiv-con/i)).toBeInTheDocument();
        });
    });

    it('shows indicator detail on click', async () => {
        renderWithContext();
        await waitFor(() => {
            expect(screen.getByText(/hiv-test/i)).toBeInTheDocument();
        });
        const title = screen.getByText(/hiv-test/i); 
        const clickableDiv = title.closest('._card_615346');
        //if (!clickableDiv) throw new Error('Clickable div not found');
        userEvent.click(clickableDiv);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText(/Proportion of individuals who received an HIV test/i)).toBeInTheDocument();
        });
    });
    it('goes to detail page on click', async () => {
        function LocationDisplay() {
            const location = useLocation();
            return <div data-testid="location-display">{location.pathname}</div>;
        }
        const mockUser = { username:'test', role: 'admin', organization_id: 1 };
        render(
            <MemoryRouter initialEntries={['/indicators']}>
            <IndicatorsProvider>
                <ProjectProvider>
                <UserAuth value={{ user: mockUser }}>
                <Routes>
                    <Route path="/indicators" element={<IndicatorsIndex />} />
                    <Route path="/indicators/:id" element={<IndicatorDetail />} />
                </Routes>
                <LocationDisplay />
                </UserAuth>
                </ProjectProvider>
            </IndicatorsProvider>
            </MemoryRouter>
        );

        // Wait for link to appear and click it
        const link = await screen.findByRole('link', { name: /hiv-test/i });
        await userEvent.click(link);

        await waitFor(() => {
            expect(screen.getByTestId('location-display')).toHaveTextContent('/indicators/1');
        });
    });
});