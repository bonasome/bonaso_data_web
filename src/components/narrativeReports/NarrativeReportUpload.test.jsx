import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import NarrativeReportUpload from './NarrativeReportUpload';
import { MockUserAuthProvider } from '../../mocks/utils/UserAuth';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mockUser = { username: 'tester', role: 'admin', organization_id: 2 };

const renderWithContext = (projectId = '99') =>
  render(
    <MemoryRouter initialEntries={[`/upload/${projectId}`]}>
      <MockUserAuthProvider mockUser={mockUser}>
        <Routes>
          <Route path="/upload/:id" element={<NarrativeReportUpload />} />
        </Routes>
      </MockUserAuthProvider>
    </MemoryRouter>
  );

describe('NarrativeReportUpload', () => {
    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it('shows loading initially, then renders form', async () => {
        renderWithContext();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() => {
        expect(screen.getByText(/Upload a Narrative Report/i)).toBeInTheDocument();
        });

        expect(screen.getByLabelText(/Upload Title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Upload Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Select an Organization/i)).toBeInTheDocument();
    });

    it('shows validation error if file is missing', async () => {
        renderWithContext();
        await waitFor(() => screen.getByText(/Upload a Narrative Report/i));

        userEvent.type(screen.getByLabelText(/Upload Title/i), 'Quarterly Report');

        userEvent.click(screen.getByRole('button', { name: /Upload/i }));

        await waitFor(() => {
            expect(screen.getByText(/Please select a file/i)).toBeInTheDocument();
        });
    });

    it('shows validation error if title is missing', async () => {
        renderWithContext();
        await waitFor(() => screen.getByText(/Upload a Narrative Report/i));

        const fileInput = screen.getByLabelText(/Upload Description/i).nextElementSibling;
        const file = new File(['dummy'], 'report.pdf', { type: 'application/pdf' });
        await userEvent.upload(fileInput, file);

        userEvent.click(screen.getByRole('button', { name: /Upload/i }));

        await waitFor(() => {
        expect(screen.getByText(/Please enter a title/i)).toBeInTheDocument();
        });
    });
});