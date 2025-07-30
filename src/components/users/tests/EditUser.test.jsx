import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { MockUserAuthProvider } from '../../../mocks/utils/UserAuth';
import EditUser from '../EditUser';
import Profile from '../Profile';
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
            <MemoryRouter initialEntries={['/profiles/1/edit']}>
            <Routes>
                <Route path="/profiles/1/edit" element={<EditUser />} />
                <Route path="/profiles/1" element={<Profile />} />
            </Routes>
            </MemoryRouter>
        </MockUserAuthProvider>
    );
};

describe('EditUser  ', () => {
    it('renders loading state initially', () => {
        renderWithContext(mockAdmin);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
            renderWithContext(mockAdmin);
            await screen.findByText(/editing/i);
    
            await waitFor(() => {
                expect(screen.getByLabelText(/username/i).value).toBe('user1');
            });
    
    });

    it('submits valid data and navigates', async () => {
        renderWithContext(mockAdmin);
        await screen.findByText(/editing/i);

        const usernameInput = screen.getByLabelText(/username/i); 
        fireEvent.change(usernameInput, { target: { value: 'the_user' } });

        const submit = screen.getByRole('button', { name: /save/i }); 
        fireEvent.click(submit);
        //renders user role select for admin
        expect(screen.queryByText('User Role *')).toBeInTheDocument();
        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/profiles/1');
        });
    });

     it('does not allow non-admin to select role', async () => {
        renderWithContext(mockMgr);
        await screen.findByText(/editing/i);

        //not for non-admin
        expect(screen.queryByText('User Role *')).not.toBeInTheDocument();
        
        const usernameInput = screen.getByLabelText(/username/i); 
        fireEvent.change(usernameInput, { target: { value: 'random_user' } });

        const submit = screen.getByRole('button', { name: /save/i }); 
        fireEvent.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/profiles/1');
        });
    });
});