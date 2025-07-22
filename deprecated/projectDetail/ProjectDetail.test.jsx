import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserAuth } from '../../../contexts/UserAuth';
import { ProjectProvider } from '../../../contexts/ProjectsContext';
import ProjectDetail from './ProjectDetail';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

export const renderWithProviders = ({ id = '1', user = { role: 'admin' } } = {}) => {
    return render(
        <UserAuth value={{ user }}>
            <ProjectProvider>
                <MemoryRouter initialEntries={[`/projects/${id}`]}>
                    <Routes>
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                    </Routes>
                </MemoryRouter>
            </ProjectProvider>
        </UserAuth>
    );
};

describe('ProjectDetail', () => {
    it('renders project info after loading', async () => {
        renderWithProviders();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() =>
        expect(screen.getByText(/return to projects overview/i)).toBeInTheDocument()
        );

        expect(screen.getByRole('heading', { name: /alpha/i })).toBeInTheDocument();
    });

    it('switches to edit mode on Edit Details click', async () => {
        renderWithProviders();

        await screen.findByText(/edit details/i);

        const editButton = screen.getByText(/edit details/i);
        expect(editButton.closest('a')).toHaveAttribute('href', '/projects/1/edit');
    });

    it('shows confirm delete modal when delete clicked', async () => {
        renderWithProviders();

        const deleteBtn = await screen.findByText(/delete/i);
        fireEvent.click(deleteBtn);

        expect(await screen.findByText(/please type "confirm" to delete/i)).toBeInTheDocument();
    });
});
