# Project Overview

This project is a static blog website for Optional Rule Games, built with Next.js and deployed on GitHub Pages. The site features a clean, modern design and is optimized for performance and SEO. It uses Tailwind CSS for styling and provides a client-side search functionality powered by Fuse.js.

The blog content is written in MDX, allowing for a rich authoring experience with embedded React components. The project includes a suite of custom scripts for managing blog posts, including creating new posts, importing from Jekyll, and generating tags and excerpts.

## Building and Running

### Development

To run the development server with hot reloading, use the following command:

```bash
npm run dev
```

This will start the server at `http://localhost:3000` and include draft posts for preview.

### Build

To build the static site for production, use the following command:

```bash
npm run build
```

This will generate the static files in the `out` directory, which is then deployed to GitHub Pages. The build process also generates a search index for the client-side search.

### Linting

To run the linter and check for code quality, use the following command:

```bash
npm run lint
```

### Testing

The project uses Vitest for testing. To run the tests, use the following command:

```bash
npm test
```

## Development Conventions

### Content Management

-   **Creating a new post:** Use the `npm run create-post` command to create a new blog post with the correct frontmatter template.
-   **Importing from Jekyll:** The `npm run import-jekyll` command can be used to import posts from a Jekyll blog.
-   **Generating tags and excerpts:** The `node scripts/tag-and-excerpt.mjs` script can be used to generate tags and excerpts for posts using an AI service.

### Search

The client-side search is implemented using Fuse.js. The search index is generated during the build process by the `scripts/generate-search-index.ts` script. The search index is a JSON file that contains the title, excerpt, tags, and other metadata for each post.

### Deployment

The site is automatically deployed to GitHub Pages on every push to the `main` branch. The deployment process is defined in the `.github/workflows/deploy.yml` file.
