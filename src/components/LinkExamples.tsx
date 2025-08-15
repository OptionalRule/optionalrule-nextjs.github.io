import SmartLink from './SmartLink';

export default function LinkExamples() {
  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg border">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        SmartLink Component Examples
      </h3>
      
      <div className="space-y-2">
        <div>
          <strong>Internal Link:</strong>{' '}
          <SmartLink href="/pages/about/" className="text-blue-600 hover:text-blue-800">
            About Page
          </SmartLink>
        </div>
        
        <div>
          <strong>External Link:</strong>{' '}
          <SmartLink href="https://nextjs.org" className="text-green-600 hover:text-green-800">
            Next.js Documentation
          </SmartLink>
        </div>
        
        <div>
          <strong>Anchor Link:</strong>{' '}
          <SmartLink href="#section" className="text-purple-600 hover:text-purple-800">
            Jump to Section
          </SmartLink>
        </div>
        
        <div>
          <strong>Email Link:</strong>{' '}
          <SmartLink href="mailto:example@example.com" className="text-orange-600 hover:text-orange-800">
            Send Email
          </SmartLink>
        </div>
        
        <div>
          <strong>Phone Link:</strong>{' '}
          <SmartLink href="tel:+1234567890" className="text-red-600 hover:text-red-800">
            Call Us
          </SmartLink>
        </div>
      </div>
    </div>
  );
}
