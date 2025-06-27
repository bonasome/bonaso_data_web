import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../mocks/handlers';
import { ProjectProvider } from '../../contexts/ProjectsContext';
import { UserAuth } from '../../contexts/UserAuth';
import EditProject from './EditProject';
import ProjectDetail from './projectDetail/ProjectDetail';
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
            <MemoryRouter initialEntries={['/projects/1/edit']}>
                <ProjectProvider>
                    <Routes>
                        <Route path="/projects/:id/edit" element={<EditProject />} />
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                    </Routes>
                </ProjectProvider>
            </MemoryRouter>
        </UserAuth>
    );
};

describe('EditProject', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
        renderWithContext();
        await screen.findByText(/editing/i);
        await waitFor(() => {
            expect(screen.getByLabelText(/project name/i).value).toBe('Alpha Project');
        });

    });

    it('submits edits and navigates to detail page', async () => {
        renderWithContext();
        await screen.findByText(/editing/i);

        const nameInput = await screen.findByLabelText(/name/i);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, ' Sigma');

        const submit = screen.getByRole('button', { name: /save/i });
        await userEvent.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/projects/1');
        });
    });
});