# Optional Rule Static Website Generators

This is website to publishe a static site for [Optional Rule Games](https://www.optionalrule.com) using [Next.js](https://nextjs.org).

The implementation builds a statis site that is served from GitHub Pages.

## Development

To setup this app locall just clone the git repository and type `npm install` to install dependencies.  

## Custom and Important npm commands

I have created a number of custom scripts for blog management that run from the command line.  

### `npm run new-post`

Creates a new blog post with the correct frontmatter template. It will prompt for the title and automatically generate the slug, date, and other required fields.

### `npm run import-jekyll`

Imports posts from a Jekyll blog, converting the frontmatter and content to be compatible with this Next.js site. It handles:

- Converting dates to the correct format
- Updating image paths
- Transforming Jekyll-specific frontmatter fields
- Preserving excerpts and metadata

### `npm run preview-images`

Shows a preview of all posts with external featured images before downloading them. Displays:

- Count of posts with external vs. local images
- List of specific posts and their external image URLs
- Summary statistics for planning the download process

### `npm run download-images`

Downloads external featured images to local storage and updates post frontmatter:

- Downloads images to `/public/images/third_party/`
- Updates `featured_image` property to local path
- Uses fallback images if download fails
- Handles HTTP/HTTPS URLs with error logging

### `npm run build`

Builds the static site, excluding any posts marked as drafts. The output is ready for deployment to GitHub Pages.

### `npm run dev`

Runs the development server with hot reloading, including draft posts for preview.

### `node scripts/tag-and-excerpt`

Runs a custom script to generate tags and a better excerpt for posts through opeanai

```
node scripts/tag-and-excerpt.mjs --api-key sk-xxx
# or
export MY_OPENAI_KEY="sk-xxx"
node scripts/tag-and-excerpt.mjs --api-key MY_OPENAI_KEY
```

## NextJS Info

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Tailwindcss](https://tailwindcss.com/) - styling done through Tailwindcss.

