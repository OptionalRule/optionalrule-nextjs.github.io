export default function HeadingAnchorDemo() {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Heading Anchor Demo
      </h3>
      
      <div className="space-y-4">
        <h1 id="main-title" className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 scroll-mt-20 group">
          Main Title
          <a 
            href="#main-title" 
            className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-2 text-lg font-normal align-text-top"
            aria-label="Link to Main Title"
            title="Link to Main Title"
          >
            #
          </a>
        </h1>
        
        <h2 id="section-one" className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-8 scroll-mt-20 group">
          Section One
          <a 
            href="#section-one" 
            className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-2 text-lg font-normal align-text-top"
            aria-label="Link to Section One"
            title="Link to Section One"
          >
            #
          </a>
        </h2>
        
        <h3 id="subsection" className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-3 mt-6 scroll-mt-20 group">
          Subsection
          <a 
            href="#subsection" 
            className="no-underline hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-2 text-lg font-normal align-text-top"
            aria-label="Link to Subsection"
            title="Link to Subsection"
          >
            #
          </a>
        </h3>
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-200">
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
