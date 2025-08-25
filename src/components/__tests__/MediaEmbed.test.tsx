import { render, screen } from '@testing-library/react';
import React from 'react';
import MediaEmbed from '../MediaEmbed';

describe('MediaEmbed', () => {
  it('renders fallback for disallowed hosts', () => {
    render(<MediaEmbed url="https://example.com/evil" />);

    expect(screen.getByText('Unsupported media URL')).toBeInTheDocument();
  });
});


