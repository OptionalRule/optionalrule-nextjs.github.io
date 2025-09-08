import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

describe('Configuration Consistency', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GoogleAnalytics does not render when GA ID is empty', async () => {
    vi.doMock('@/config/site', () => ({
      siteConfig: {
        analytics: { googleAnalyticsId: '' },
      },
    }));

    const mod = await import('@/components/GoogleAnalytics');
    const { container } = render(React.createElement(mod.GoogleAnalytics));
    expect(container.innerHTML).toBe('');
  });
});

