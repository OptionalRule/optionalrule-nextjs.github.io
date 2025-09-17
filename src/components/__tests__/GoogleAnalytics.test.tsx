import React from 'react';
import { render } from '@testing-library/react';
import { siteConfig } from '@/config/site';

type MockedScriptCall = { __esModule?: boolean } & Record<string, unknown> & { children?: React.ReactNode };
const scriptCalls: MockedScriptCall[] = [];


vi.mock('next/script', () => ({
  __esModule: true,
  default: (props: MockedScriptCall) => {
    scriptCalls.push(props);
    const { children, ...rest } = props;
    return (
      <span data-testid="mock-script" data-props={JSON.stringify(rest)}>
        {children ?? null}
      </span>
    );
  },
}));

import { GoogleAnalytics } from '../GoogleAnalytics';

describe('GoogleAnalytics component', () => {
  const originalId = siteConfig.analytics.googleAnalyticsId;

  beforeEach(() => {
    scriptCalls.length = 0;
  });

  afterEach(() => {
    siteConfig.analytics.googleAnalyticsId = originalId;
  });

  it('renders nothing when GA id is missing or invalid', () => {
    siteConfig.analytics.googleAnalyticsId = '';
    const { container } = render(<GoogleAnalytics />);
    expect(container).toBeEmptyDOMElement();
    expect(scriptCalls).toHaveLength(0);
  });

  it('injects GA scripts when a valid id is configured', () => {
    siteConfig.analytics.googleAnalyticsId = 'G-TEST1234';
    render(<GoogleAnalytics nonce="abc" />);

    expect(scriptCalls).toHaveLength(2);
    const [loaderScript, inlineScript] = scriptCalls;

    expect(loaderScript.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST1234');
    expect(loaderScript.nonce).toBe('abc');
    expect(loaderScript.strategy).toBe('afterInteractive');

    expect(inlineScript.id).toBe('google-analytics');
    expect(inlineScript.nonce).toBe('abc');
    expect(inlineScript.strategy).toBe('afterInteractive');
    expect(typeof inlineScript.children).toBe('string');
    expect(inlineScript.children).toContain("gtag('config', 'G-TEST1234')");
  });
});


