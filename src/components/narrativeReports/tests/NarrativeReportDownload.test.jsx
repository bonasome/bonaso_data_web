import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../mocks/server'
import { parentOrgDetail } from '../../../mocks/handlerHelpers/organizationsHandler';
import { getProjectDetail } from '../../../mocks/handlerHelpers/projectHandler';
import NarrativeReportDownload from '../NarrativeReportDownload';
import { MockUserAuthProvider } from '../../../mocks/utils/UserAuth';

const renderWithContext = () =>
  render(
    <MockUserAuthProvider mockUser={{role: 'admin'}}>
        <NarrativeReportDownload organization={parentOrgDetail} project={getProjectDetail} />
    </MockUserAuthProvider>
  );

describe('NarrativeReportDownload', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

    it('shows loading initially then renders report list', async () => {
        renderWithContext();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Narrative Reports for Alpha Project')).toBeInTheDocument();
            expect(screen.getByText('Report 1')).toBeInTheDocument();
            expect(screen.getByText('Description for report 1')).toBeInTheDocument();
            expect(screen.getByText('Report 2')).toBeInTheDocument();
        });
    });

    it('downloads a report when download button is clicked', async () => {
        renderWithContext();

        await waitFor(() => screen.getByText('Report 1'));

        const createObjectURLMock = vi.fn(() => 'blob:http://dummy-url');
        const revokeObjectURLMock = vi.fn();
        global.URL.createObjectURL = createObjectURLMock;
        global.URL.revokeObjectURL = revokeObjectURLMock;

        userEvent.click(screen.getAllByRole('button', { name: /download/i })[0]);

        await waitFor(() => {
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(revokeObjectURLMock).toHaveBeenCalled();
        });
    });
});