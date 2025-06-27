import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../mocks/handlers';
import { RespondentsProvider } from '../../contexts/RespondentsContext';
import { UserAuth } from '../../contexts/UserAuth';
import CreateRespondent from './CreateRespondent';
import userEvent from '@testing-library/user-event';

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
                <RespondentsProvider>
                    <CreateRespondent />
                </RespondentsProvider>
            </BrowserRouter>
        </UserAuth>
    );
};

describe('CreateRespondent  ', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
        renderWithContext();
        await screen.findByText(/New Respondent/i);
        expect(screen.getByRole('heading', { name: /new respondent/i })).toBeInTheDocument();
    });

  it('submits valid data and navigates', async () => {
        renderWithContext();
        await screen.findByText(/New Respondent/i);

        const fnameInput = screen.getByLabelText(/First Name/i); 
        await user.type(fnameInput, 'Test');

        const lnameInput = screen.getByLabelText(/surname/i); 
        fireEvent.change(lnameInput, { target: { value: 'Testerson' } });

        const idInput = screen.getByLabelText(/passport number/i); 
        fireEvent.change(idInput, { target: { value: '1234' } });

        const districtInput = screen.getByLabelText(/district/i); 
        fireEvent.change(districtInput, { target: { value: 'central' } });

        const sexInput = screen.getByLabelText(/sex/i); 
        fireEvent.change(sexInput, { target: { value: 'male' } });

        const villageInput = screen.getByLabelText(/village/i); 
        fireEvent.change(villageInput, { target: { value: 'here' } });

        const dobInput = screen.getByLabelText(/date of birth/i); 
        fireEvent.change(dobInput, { target: { value: '2000-01-01' } });
        
        const submit = screen.getByRole('button', { name: /save/i }); 
        fireEvent.click(submit);
        //citizenship should default rendering this ok
        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/respondents/99');
        });
    });

    it('also for anonymous', async () => {
        renderWithContext();
        await screen.findByText(/New Respondent/i);

        const anon = screen.getByLabelText(/remain anonymous/i);
        user.click(anon);
        
        await screen.findByText(/age range/i);
        const arInput = screen.getByLabelText(/age range/i); 
        fireEvent.change(arInput, { target: { value: '18_24' } });

        const districtInput = screen.getByLabelText(/district/i); 
        fireEvent.change(districtInput, { target: { value: 'central' } });

        const sexInput = screen.getByLabelText(/sex/i); 
        fireEvent.change(sexInput, { target: { value: 'male' } });

        const villageInput = screen.getByLabelText(/village/i); 
        fireEvent.change(villageInput, { target: { value: 'here' } });
        
        const submit = screen.getByRole('button', { name: /save/i }); 
        fireEvent.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/respondents/99');
        });
    });
    it('shows error message when submission fails', async () => {
        renderWithContext();
        await screen.findByText(/New Respondent/i);

        const submit = screen.getByRole('button', { name: /save/i });
        fireEvent.click(submit);

        await screen.findByText(/first name is required./i);
    });
});