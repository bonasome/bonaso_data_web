import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { IndicatorsProvider } from '../../../contexts/IndicatorsContext';
import { UserAuth } from '../../../contexts/UserAuth';
import CreateIndicator from '../CreateIndicator';

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
                <IndicatorsProvider>
                    <CreateIndicator />
                </IndicatorsProvider>
            </BrowserRouter>
        </UserAuth>
    );
};

describe('CreateIndicator', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
        renderWithContext();
        await screen.findByText(/New Indicator/i);
        expect(screen.getByRole('heading', { name: /new indicator/i })).toBeInTheDocument();
    });

  it('submits valid data and navigates', async () => {
        renderWithContext();
        await screen.findByText(/New Indicator/i);

        const nameInput = screen.getByLabelText(/name/i); 
        fireEvent.change(nameInput, { target: { value: 'New Indicator X' } });

        const codeInput = screen.getByLabelText(/code/i); 
        fireEvent.change(codeInput, { target: { value: 'X' } });

        const statusInput = screen.getByLabelText(/status/i); 
        fireEvent.change(statusInput, { target: { value: 'Active' } });

        const boolSubcatsInput = screen.getByLabelText(/require subcategories/i);
        fireEvent.click(boolSubcatsInput);

        //ideally row logic gets tested for in its own component, but make sure here that it submits
        const subcatOneInput = screen.getByLabelText(/1/i); 
        fireEvent.change(subcatOneInput, { target: { value: 'Cat 1' } });

        const addRow = screen.getByRole('button', { name: /add row/i }); 
        fireEvent.click(addRow);

        const subcatTwoInput = screen.getByLabelText(/2/i); 
        fireEvent.change(subcatTwoInput, { target: { value: 'Cat 2' } });
        
        const submit = screen.getByRole('button', { name: /save/i }); 
        fireEvent.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/indicators/99');
        });
    });

    it('shows error message when submission fails', async () => {
        renderWithContext();
        await screen.findByText(/New Indicator/i);

        const submit = screen.getByRole('button', { name: /save/i });
        fireEvent.click(submit);

        await screen.findByText(/name is required./i);
    });
});