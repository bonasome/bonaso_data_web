import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { MockUserAuthProvider } from '../../../mocks/utils/UserAuth';
import CreateUser from '../CreateUser';
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


const mockAdmin = { username:'test1', role: 'admin', organization_id: 1 };
const mockMgr = { username:'test2', role: 'manager', organization_id: 1 };
export const renderWithContext = (user) => {
    return render(
        <MockUserAuthProvider mockUser={user}>
            <CreateUser />
        </MockUserAuthProvider>
    );
};

describe('CreateUser  ', () => {
    it('renders loading state initially', () => {
        renderWithContext(mockAdmin);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
        renderWithContext(mockAdmin);
        await screen.findByText(/New User/i);
        expect(screen.getByRole('heading', { name: /new user/i })).toBeInTheDocument();
    });

  it('submits valid data and navigates', async () => {
        renderWithContext(mockAdmin);
        await screen.findByText(/New User/i);

        const fnameInput = screen.getByLabelText(/First Name/i); 
        await user.type(fnameInput, 'User');

        const lnameInput = screen.getByLabelText(/last name/i); 
        fireEvent.change(lnameInput, { target: { value: 'Thrie' } });

        const pInput = screen.getByLabelText(/enter password/i); 
        fireEvent.change(pInput, { target: { value: 'pass' } });

        const cpInput = screen.getByLabelText(/confirm password/i); 
        fireEvent.change(cpInput, { target: { value: 'pass' } });

        const idInput = screen.getByLabelText(/username/i); 
        fireEvent.change(idInput, { target: { value: '3' } });

        const orgInput = screen.getByLabelText(/organization/i); 
        fireEvent.change(orgInput, { target: { value: '1' } });

        expect(screen.queryByText('User Role *')).toBeInTheDocument();
        const roleInput = screen.getByLabelText(/role/i); 
        fireEvent.change(roleInput, { target: { value: 'admin' } });

        
        const submit = screen.getByRole('button', { name: /save/i }); 
        fireEvent.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/profiles/99');
        });
    });

     it('does not allow non-admin to select role', async () => {
        renderWithContext(mockMgr);
        await screen.findByText(/New User/i);

        const fnameInput = screen.getByLabelText(/First Name/i); 
        await user.type(fnameInput, 'User');

        const lnameInput = screen.getByLabelText(/last name/i); 
        fireEvent.change(lnameInput, { target: { value: 'Thrie' } });

        const pInput = screen.getByLabelText(/enter password/i); 
        fireEvent.change(pInput, { target: { value: 'pass' } });

        const cpInput = screen.getByLabelText(/confirm password/i); 
        fireEvent.change(cpInput, { target: { value: 'pass' } });

        const idInput = screen.getByLabelText(/username/i); 
        fireEvent.change(idInput, { target: { value: '3' } });

        const orgInput = screen.getByLabelText(/organization/i); 
        fireEvent.change(orgInput, { target: { value: '1' } });

        expect(screen.queryByText('User Role *')).not.toBeInTheDocument();

        const submit = screen.getByRole('button', { name: /save/i }); 
        fireEvent.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/profiles/99');
        });
    });

    it('shows error message when submission fails', async () => {
        renderWithContext(mockAdmin);
        await screen.findByText(/New User/i);

        const submit = screen.getByRole('button', { name: /save/i });
        fireEvent.click(submit);

        await screen.findByText(/first name is required./i);
    });
});