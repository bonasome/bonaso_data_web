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



const renderAddInteractions = (overrides = {}) => {
  const mockUser = { organization_id: 10 };
  const defaultProps = {
    id: 1,
    tasks: [mockTask],
    interactions: [],
    onUpdate: vi.fn(),
    onFinish: vi.fn(),
  };

  return render(
    <UserAuth value={{ user: mockUser }}>
      <MemoryRouter initialEntries={['/respondents/1']}>
        <RespondentsProvider>
          <InteractionsProvider>
            <AddInteractions {...defaultProps} {...overrides} />
          </InteractionsProvider>
        </RespondentsProvider>
      </MemoryRouter>
    </UserAuth>
  );
};


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

const mockTaskSC = {
    id: 3,
    indicator: {
        id: 3,
        name: 'Condom Distribution',
        code: 'CD',
        require_numeric: false,
        subcategories: [{id: 1, name: 'Option 1'}, {id: 2, name:'Option 2'}],
        prerequisite: null,
    },
};

const mockTaskSCChild = {
    id: 4,
    indicator: {
        id: 4,
        name: 'Other Condom Distribution',
        code: 'CD',
        require_numeric: false,
        subcategories: [{id: 1, name: 'Option 1'}, {id: 2, name:'Option 2'}],
        prerequisite: { id: 4, name: 'Condom Distribution' },
    },
};

const mockTaskNum = {
    id: 5,
    indicator: {
        id: 5,
        name: 'Condom Distribution',
        code: 'CD',
        require_numeric: true,
        subcategories: [],
        prerequisite: null,
    },
};

describe('AddInteraction', () => {
    it('renders heading text', async () => {
        renderAddInteractions();
        expect(await screen.findByRole('heading', { name: /new interaction/i })).toBeInTheDocument();
    });

    it('shows number modal when task with require_numeric is dropped', async () => {
        renderAddInteractions();

        const dropBox = screen.getByText(/drag an indicator/i).closest('div');

        const dataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTaskNum)),
        };

        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer });

        expect(await screen.findByText(/the task condom distribution requires a numeric component/i)).toBeInTheDocument();
    });
    it('shows subcat modal when task with subcategories is dropped', async () => {
        renderAddInteractions();

        const dropBox = screen.getByText(/drag an indicator/i).closest('div');

        const dataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTaskSC)),
        };

        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer });

        expect(await screen.findByText(/please select all relevant subcategories related to/i)).toBeInTheDocument();
    });
    it('shows warning if prereq is missing', async () => {
        renderAddInteractions();

       const dropBox = screen.getByText(/drag an indicator/i).closest('div');

        const dataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTaskChild)),
        };

        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer });

        expect(await screen.findByText(/this indicator requires this respondent to have been/i)).toBeInTheDocument();
    });
    it('allows prereq if prerequisite was dropped first', async () => {
        renderAddInteractions();

        const dropBox = screen.getByText(/drag an indicator/i).closest('div');

        // Drop the prerequisite task first
        const prereqDataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTask)),
        };
        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer: prereqDataTransfer });

        const dateInput = screen.getByLabelText(/Interaction Date/); 
        fireEvent.change(dateInput, { target: { value: '2025-06-01' } });

        // Drop the main task that requires the prerequisite
        const mainDataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTaskChild)),
        };
        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer: mainDataTransfer });

        // Assert that both indicators are now visible
        expect(await screen.findByText(/Condom Distribution/i)).toBeInTheDocument();
        expect(await screen.findByText(/Condoms Distribution II/i)).toBeInTheDocument();
    });

    it('limits subcategories if there is a prerequisite', async () => {
        renderAddInteractions();

        const dropBox = screen.getByText(/drag an indicator/i).closest('div');

        // Drop the prerequisite task first
        const prereqDataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTaskSC)),
        };
        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer: prereqDataTransfer });

        const o1Subcat = screen.getByLabelText(/option 1/i);
        fireEvent.click(o1Subcat);

        const confirm = screen.getByRole('button', { name: /confirm/i });
        fireEvent.click(confirm);

        const dateInput = screen.getByLabelText(/Interaction Date/); 
        fireEvent.change(dateInput, { target: { value: '2025-06-01' } });


        const childDataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTaskSCChild)),
        };
        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer: childDataTransfer });

        expect(screen.queryByLabelText(/option 2/i)).not.toBeInTheDocument();
    });
    it('can remove a task', async () => {
        renderAddInteractions();

       const dropBox = screen.getByText(/drag an indicator/i).closest('div');

        const dataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTask)),
        };

        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer });

        expect(await screen.findByText(/condom distribution/i)).toBeInTheDocument();

        const remove = screen.getByRole('button', { name: /remove/i });
        fireEvent.click(remove);
        expect(screen.queryByLabelText(/condom distribution/i)).not.toBeInTheDocument();
    });
    it('submit interactions with proper format', async () => {
        renderAddInteractions();

        const dropBox = screen.getByText(/drag an indicator/i).closest('div');

        // Drop the prerequisite task first
        const prereqDataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTask)),
        };
        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer: prereqDataTransfer });

        const dateInput = screen.getByLabelText(/Interaction Date/); 
        fireEvent.change(dateInput, { target: { value: '2025-06-01' } });

        // Drop the main task that requires the prerequisite
        const mainDataTransfer = {
            getData: vi.fn().mockReturnValue(JSON.stringify(mockTaskChild)),
        };
        fireEvent.dragOver(dropBox);
        fireEvent.drop(dropBox, { dataTransfer: mainDataTransfer });

        // Assert that both indicators are now visible
        expect(await screen.findByText(/Condom Distribution/i)).toBeInTheDocument();
        expect(await screen.findByText(/Condoms Distribution II/i)).toBeInTheDocument();

        const save = screen.getByRole('button', { name: /save/i });
        fireEvent.click(save);
    });
});