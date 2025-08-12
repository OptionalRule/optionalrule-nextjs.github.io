import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <nav className="flex items-center justify-between">
          <div>
            <Link 
              href="/" 
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              My Blog
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Web development insights & best practices
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about/"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              About
            </Link>
            <Link
              href="/tags/"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              Tags
            </Link>
            <Link
              href="/rss.xml"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title="RSS Feed"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3.429 2.68c6.316 0 11.436 5.12 11.436 11.436h2.857C17.722 8.771 12.774 3.823 7.429 3.823v-1.143zm0 2.857c4.457 0 8.08 3.623 8.08 8.08h2.857c0-6.023-4.914-10.937-10.937-10.937v2.857zM6.114 12.171c.631 0 1.143.512 1.143 1.143s-.512 1.143-1.143 1.143-1.143-.512-1.143-1.143.512-1.143 1.143-1.143z" />
              </svg>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}