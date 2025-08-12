// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Generate post URL from date and slug
export function generatePostUrl(date: string, slug: string): string {
  const postDate = new Date(date);
  const year = postDate.getFullYear();
  const month = String(postDate.getMonth() + 1).padStart(2, '0');
  const day = String(postDate.getDate()).padStart(2, '0');
  
  return `/${year}/${month}/${day}/${slug}/`;
}

// Capitalize first letter of string
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate page title with site name
export function generatePageTitle(title: string, siteName: string = 'My Blog'): string {
  return title ? `${title} | ${siteName}` : siteName;
}

// Generate meta description
export function generateMetaDescription(description?: string, excerpt?: string, defaultDescription: string = 'A modern blog about web development, best practices, and emerging technologies.'): string {
  return description || excerpt || defaultDescription;
}