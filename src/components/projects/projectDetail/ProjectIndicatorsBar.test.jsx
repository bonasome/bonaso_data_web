import { render, fireEvent } from '@testing-library/react';
import { MockUserAuthProvider } from '../../../mocks/utils/UserAuth';
import { ProjectProvider } from '../../../contexts/ProjectsContext';
import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { IndicatorsBar, AddIndicator, ViewIndicator } from './ProjectIndicators';
import { getProjectDetail } from '../../../mocks/handlerHelpers/projectHandler';
import userEvent from '@testing-library/user-event';;
const user = userEvent.setup();

const cb = vi.fn();
const mockAdmin = { username:'test', role: 'admin', organization_id: 1 };
const mockMgr = { username:'test', role: 'manager', organization_id: 1 };
export const renderWithContext = (user) => {
    return render(
        <MockUserAuthProvider mockUser={user}>
            <ProjectProvider>
                <IndicatorsBar project={getProjectDetail} callback={cb} visChange={vi.fn()} />
            </ProjectProvider>
        </MockUserAuthProvider>
    );
};

describe('ProjectIndicators', () => {
    it('calls callback with indicator when clicked', () => {
    
        renderWithContext(mockAdmin);
        fireEvent.click(screen.getByText(/HIV-CON/));
        expect(cb).toHaveBeenCalledWith('view-indicator', expect.any(Object));
    });
    it('allows admin to add project', async () => {
        renderWithContext(mockAdmin);
        expect(screen.queryByText('Add an Indicator')).toBeInTheDocument();
    });
    it('not managers or me officers though', async () => {
        renderWithContext(mockMgr);
        expect(screen.queryByText('Add an Indicator')).not.toBeInTheDocument();
    });
});