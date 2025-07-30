import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { ProjectProvider } from '../../../contexts/ProjectsContext';
import { UserAuth } from '../../../contexts/UserAuth';
import CreateProject from '../CreateProject';
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
                <ProjectProvider>
                    <CreateProject />
                </ProjectProvider>
            </BrowserRouter>
        </UserAuth>
    );
};

describe('CreateProject', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
        renderWithContext();
        await screen.findByText(/New Project/i);
        expect(screen.getByRole('heading', { name: /new project/i })).toBeInTheDocument();
    });

    it('submits valid data and navigates', async () => {
        renderWithContext();
        await screen.findByText(/New Project/i);

        const nameInput = await screen.findByLabelText(/name/i); 
        await user.type(nameInput, 'New Project X');

        const clientInput = await screen.findByLabelText(/client/i); 
        await user.selectOptions(clientInput, ['1']); // assuming <option value="1">NAHPA</option>

        const startInput = await screen.findByLabelText(/start/i); 
        await user.type(startInput, '2025-01-01');

        const endInput = await screen.findByLabelText(/end/i); 
        await user.type(endInput, '2025-12-31');

        const statusInput = await screen.findByLabelText(/status/i); 
        await user.selectOptions(statusInput, ['active']); // use correct lowercase value

        const submit = screen.getByRole('button', { name: /save/i }); 
        await user.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/projects/99');
        });
    });

    it('shows error message when submission fails', async () => {
        renderWithContext();
        await screen.findByText(/New Project/i);

        const submit = screen.getByRole('button', { name: /save/i });
        fireEvent.click(submit);

        await screen.findByText(/name is required./i);
    });
});