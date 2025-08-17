import SmartLink from './SmartLink';

export default function LinkExamples() {
  return (
    <div className="space-y-4 p-6 bg-[var(--card)] rounded-lg border border-[var(--border)]">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">
        SmartLink Component Examples
      </h3>
      
      <div className="space-y-2">
        <div>
          <strong>Internal Link:</strong>{' '}
          <SmartLink href="/pages/about/" className="text-[var(--link)] hover:text-[var(--link-hover)]">
            About Page
          </SmartLink>
        </div>
        
        <div>
          <strong>External Link:</strong>{' '}
          <SmartLink href="https://nextjs.org" className="text-[var(--link)] hover:text-[var(--link-hover)]">
            Next.js Documentation
          </SmartLink>
        </div>
        
        <div>
          <strong>Anchor Link:</strong>{' '}
          <SmartLink href="#section" className="text-[var(--link)] hover:text-[var(--link-hover)]">
            Jump to Section
          </SmartLink>
        </div>
        
        <div>
          <strong>Email Link:</strong>{' '}
          <SmartLink href="mailto:example@example.com" className="text-[var(--link)] hover:text-[var(--link-hover)]">
            Send Email
          </SmartLink>
        </div>
        
        <div>
          <strong>Phone Link:</strong>{' '}
          <SmartLink href="tel:+1234567890" className="text-[var(--link)] hover:text-[var(--link-hover)]">
            Call Us
          </SmartLink>
        </div>
      </div>
    </div>
  );
}
