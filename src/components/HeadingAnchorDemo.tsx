export default function HeadingAnchorDemo() {
  return (
    <div className="p-6 bg-[var(--card)] rounded-lg border border-[var(--border)] space-y-6">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
        Heading Anchor Demo
      </h3>
      
      <div className="space-y-4">
        <h1 id="main-title" className="text-4xl font-bold text-[var(--foreground)] mb-6 scroll-mt-20 group">
          Main Title
          <a 
            href="#main-title" 
            className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-[var(--link)] hover:text-[var(--link-hover)] ml-2 text-lg font-normal align-text-top"
            aria-label="Link to Main Title"
            title="Link to Main Title"
          >
            #
          </a>
        </h1>
        
        <h2 id="section-one" className="text-3xl font-semibold text-[var(--foreground)] mb-4 mt-8 scroll-mt-20 group">
          Section One
          <a 
            href="#section-one" 
            className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-[var(--link)] hover:text-[var(--link-hover)] ml-2 text-lg font-normal align-text-top"
            aria-label="Link to Section One"
            title="Link to Section One"
          >
            #
          </a>
        </h2>
        
        <h3 id="subsection" className="text-2xl font-medium text-[var(--foreground)] mb-3 mt-6 scroll-mt-20 group">
          Subsection
          <a 
            href="#subsection" 
            className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-[var(--link)] hover:text-[var(--link-hover)] ml-2 text-lg font-normal align-text-top"
            aria-label="Link to Subsection"
            title="Link to Subsection"
          >
            #
          </a>
        </h3>
      </div>
      
      <div className="mt-6 p-3 rounded text-sm" style={{background:"color-mix(in oklab, var(--link) 10%, transparent)", color:"var(--link)"}}>
        <strong>How it works:</strong>
        <ul className="mt-2 space-y-1">
          <li>• Hover over any heading to see the # anchor link appear</li>
          <li>• The # link appears <strong>after</strong> the heading text</li>
          <li>• Click the # to copy the direct link to that section</li>
          <li>• All headings automatically get unique, slugified IDs</li>
        </ul>
      </div>
    </div>
  );
}
