import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../mocks/handlers';
import { IndicatorsProvider } from '../../contexts/IndicatorsContext';
import { UserAuth } from '../../contexts/UserAuth';
import EditIndicator from './EditIndicator';
import IndicatorDetail from './IndicatorDetail';
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
            <MemoryRouter initialEntries={['/indicators/1/edit']}>
                <IndicatorsProvider>
                    <Routes>
                        <Route path="/indicators/:id/edit" element={<EditIndicator />} />
                        <Route path="/indicators/:id" element={<IndicatorDetail />} />
                    </Routes>
                </IndicatorsProvider>
            </MemoryRouter>
        </UserAuth>
    );
};

describe('EditIndicator', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
        renderWithContext();
        await screen.findByText(/editing/i);
        await waitFor(() => {
            expect(screen.getByLabelText(/indicator name/i).value).toBe('HIV Testing');
            expect(screen.getByLabelText(/indicator code/i).value).toBe('HIV-TEST');
        });

    });

    it('submits edits and navigates to detail page', async () => {
        renderWithContext();
        await screen.findByText(/editing/i);

        const nameInput = await screen.findByLabelText(/name/i);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, ' Total');

        const submit = screen.getByRole('button', { name: /save/i });
        await userEvent.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/indicators/1');
        });
    });
});