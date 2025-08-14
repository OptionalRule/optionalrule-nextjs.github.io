import { generateHeadingId } from '@/lib/utils';

export default function HeadingIdDemo() {
  const testHeadings = [
    "Getting Started with Next.js",
    "What is Next.js?",
    "Key Features",
    "Getting Started",
    "Project Structure",
    "Conclusion"
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Heading ID Generation Examples
      </h3>
      
      <div className="space-y-2">
        {testHeadings.map((heading, index) => (
          <div key={index} className="text-sm">
            <strong>&ldquo;{heading}&rdquo;</strong> → <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">#{generateHeadingId(heading)}</code>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-200">
        <strong>Note:</strong> These IDs are automatically generated and used as anchor links. 
        Click on any heading in your posts to see the # symbol appear, then click the # to copy the direct link.
      </div>
    </div>
  );
}
