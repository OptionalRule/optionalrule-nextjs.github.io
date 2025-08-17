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
    <div className="p-6 bg-[var(--card)] rounded-lg border border-[var(--border)]">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
        Heading ID Generation Examples
      </h3>
      
      <div className="space-y-2">
        {testHeadings.map((heading, index) => (
          <div key={index} className="text-sm">
            <strong>&ldquo;{heading}&rdquo;</strong> → <code className="bg-[var(--surface-hover)] px-2 py-1 rounded">#{generateHeadingId(heading)}</code>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 rounded text-sm" style={{background:"color-mix(in oklab, var(--link) 10%, transparent)", color:"var(--link)"}}>
        <strong>Note:</strong> These IDs are automatically generated and used as anchor links. 
        Click on any heading in your posts to see the # symbol appear, then click the # to copy the direct link.
      </div>
    </div>
  );
}
