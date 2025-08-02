import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import IndexViewWrapper from '../IndexView';

describe('IndexViewWrapper', () => {
  const childrenText = 'Child content';

  it('renders input, buttons, and children', () => {
    render(
      <IndexViewWrapper entries={45}>
        <div>{childrenText}</div>
      </IndexViewWrapper>
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByText(childrenText)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    expect(screen.getByText(/Showing Page 1 of 3/i)).toBeInTheDocument();
  });

  it('calls onSearchChange and onPageChange with correct values', () => {
    const onSearchChange = vi.fn();
    const onPageChange = vi.fn();

    render(
      <IndexViewWrapper entries={50} onSearchChange={onSearchChange} onPageChange={onPageChange}>
        <div>{childrenText}</div>
      </IndexViewWrapper>
    );

    // Type in search box
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test search' } });

    // Click search button
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(onSearchChange).toHaveBeenCalledWith('test search');
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('navigates pages and disables buttons correctly', () => {
    const onPageChange = vi.fn();

    render(
      <IndexViewWrapper entries={25} onPageChange={onPageChange}>
        <div>{childrenText}</div>
      </IndexViewWrapper>
    );

    const prevButton = screen.getByRole('button', { name: /previous page/i });
    const nextButton = screen.getByRole('button', { name: /next page/i });

    // Initially on page 1, so Previous should be disabled, Next enabled
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // Click Next Page to go to page 2
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByText(/Showing Page 2 of 2/i)).toBeInTheDocument();

    // Now Previous should be enabled, Next disabled (last page)
    expect(prevButton).toBeEnabled();
    expect(nextButton).toBeDisabled();

    // Click Previous Page to go back to page 1
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByText(/Showing Page 1 of 2/i)).toBeInTheDocument();

    // Buttons state updated accordingly
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();
  });
});