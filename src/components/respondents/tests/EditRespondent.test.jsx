import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { RespondentsProvider } from '../../../contexts/RespondentsContext';
import { UserAuth } from '../../../contexts/UserAuth';
import EditRespondent from '../EditRespondent';
import RespondentDetail from '../RespondentDetail';
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
            <MemoryRouter initialEntries={['/respondents/1/edit']}>
                <RespondentsProvider>
                    <Routes>
                        <Route path="/respondents/:id/edit" element={<EditRespondent />} />
                        <Route path="/respondents/:id" element={<RespondentDetail />} />
                    </Routes>
                </RespondentsProvider>
            </MemoryRouter>
        </UserAuth>
    );
};

describe('EditRespondent', () => {
    it('renders loading state initially', () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
        renderWithContext();
        await screen.findByText(/editing/i);
        await waitFor(() => {
            expect(screen.getByLabelText(/first name/i).value).toBe('John');
            expect(screen.getByLabelText(/sex/i).value).toBe('male');
        });

    });

    it('submits edits and navigates to detail page', async () => {
        renderWithContext();
        await screen.findByText(/editing/i);

        const nameInput = await screen.findByLabelText(/ward/i);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'ssman');

        const submit = screen.getByRole('button', { name: /save/i });
        await userEvent.click(submit);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/respondents/1');
        });
    });
});