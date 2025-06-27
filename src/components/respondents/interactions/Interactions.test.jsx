import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers';
import { InteractionsProvider } from '../../../contexts/InteractionsContext';
import { UserAuth } from '../../../contexts/UserAuth';
import { RespondentsProvider } from '../../../contexts/RespondentsContext'
import RespondentDetail from '../RespondentDetail'
import Interactions from './Interactions';
import AddInteractions from './AddInteractions';

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

const mockTask = {
    id: 1,
    indicator: {
        id: 1,
        name: 'Condom Distribution',
        code: 'CD',
        require_numeric: false,
        subcategories: [],
        prerequisite: null,
    },
};

const mockTaskChild = {
    id: 2,
    indicator: {
        id: 2,
        name: 'Condoms Distribution II',
        code: 'CD',
        require_numeric: false,
        subcategories: [],
        prerequisite: { id: 1, name: 'Condom Distribution' }
    },
};

const renderInteractions = (overrides = {}) => {
  const mockUser = { role: 'admin', organization_id: 1 };
  const defaultProps = {
        id: 1,
        tasks: [mockTask, mockTaskChild],
        interactions: [],
        onUpdate: vi.fn(),
    };

  return render(
    <UserAuth value={{ user: mockUser }}>
      <MemoryRouter initialEntries={['/respondents/1']}>
        <RespondentsProvider>
          <InteractionsProvider>
            <Interactions {...defaultProps} {...overrides} />
          </InteractionsProvider>
        </RespondentsProvider>
      </MemoryRouter>
    </UserAuth>
  );
};

describe('AddInteraction', () => {
    it('renders fetched interaction cards', async () => {
        renderInteractions(); 
        
        expect(await screen.findByText(/start dragging and dropping tasks to begin/i)).toBeInTheDocument();
        expect(await screen.findByText(/previous interactions/i)).toBeInTheDocument();

        expect(await screen.findByRole('heading', { name: /HIV-MSG/i })).toBeInTheDocument();
    });
    it('expands interaction card to show details', async () => {
        renderInteractions(); 

        const card = await screen.findByRole('heading', { name: /HIV-MSG/i });
        fireEvent.click(card); // expand

        expect(await screen.findByText(/Subcategories:/i)).toBeInTheDocument();
        expect(await screen.findByText(/ccc/i)).toBeInTheDocument();
        expect(await screen.findByText(/testing/i)).toBeInTheDocument();
    });
    it('enters edit mode on click and shows inputs', async () => {
        renderInteractions();

        const card = await screen.findByRole('heading', { name: /HIV-MSG/i });
        fireEvent.click(card);

        const editButton = await screen.findByRole('button', { name: /edit interaction/i });
        expect(editButton).toBeInTheDocument();
        fireEvent.click(editButton);
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });
    it('submits edited interaction successfully', async () => {
        renderInteractions();

        fireEvent.click(await screen.findByRole('heading', { name: /HIV-MSG/i }));
        fireEvent.click(await screen.findByRole('button', { name: /edit interaction/i }));

        const dateInput = screen.getByLabelText(/date/i);
        fireEvent.change(dateInput, { target: { value: '2025-06-01' } });

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() =>
            expect(screen.queryByLabelText(/date/i)).not.toBeInTheDocument()
        );
    });
    it('flags and unflags an interaction', async () => {
        renderInteractions();

        fireEvent.click(await screen.findByRole('heading', { name: /HIV-MSG/i }));

        const flagButton = await screen.findByRole('button', { name: /flag/i });
        fireEvent.click(flagButton);

        expect(await screen.findByText(/flagged/i)).toBeInTheDocument();

        fireEvent.click(await screen.findByRole('heading', { name: /HIV-MSG/i }));
        fireEvent.click(screen.getByRole('button', { name: /mark as ok/i }));
        await waitFor(() => {
            expect(screen.queryByText(/flagged/i)).not.toBeInTheDocument();
        });
    });

    it('shows confirm dialog and deletes on confirm', async () => {
        renderInteractions();

        fireEvent.click(await screen.findByRole('heading', { name: /HIV-MSG/i }));

        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);

        expect(await screen.findByText(/this cannot be undone/i)).toBeInTheDocument();
        const dateInput = screen.getByLabelText(/please type "confirm"/i);
        fireEvent.change(dateInput, { target: { value: 'confirm' } });

        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

        await waitFor(() =>
            expect(screen.queryByRole('heading', { name: /HIV-MSG/i })).not.toBeInTheDocument()
        );
    });
});