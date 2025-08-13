# Plan for Jekyll Content Migration Scripts

Create a script that can be run from command line with `npm run import-jekyll-posts`.

It should ask for a source directory for jekyll post and part and import each post into the NextJS mdx format, converting frontmatter to local gray matter fields as indicated below.

For now, simply import post content as is.

## Jekyll Post Files

Jekll posts are markdown files with meatadata stored in yaml like frontmatter fields at the top of the file.  Slugs are derrived from the slug portion of the filename.

Filenames always fit the pattern `YYYY-MM-DD-slug.md`

## Jekyll Frontmatter Fields

This is a list of the Jekyll frontmatter fields use in the source files.  All fields are optional.  The list of fields are as follows:

* **`title`**
* **`author`**
* **`layout`**
* **`image`** 
* **`description`**
* **`categories`**
* **`date`**
* **`tags`**
* **`subtitle`**
* **`summary`**

**Note:** Jekyll uses optional fields on almost all cases so when reading and parsing these must be read as optional in cases where nothing exists.

## NextJS gray-matter field imports

The post gray-matter fields should import data from the Jekyll post as follows:

* slug:  Should be derrived from the slug portion of the Jekyll post filename.
* title: Imported form title
* date:  Imported from date but should only use the YYYY-MM-DD portion.  Jekyll dates may also containe timestamps
* excerpt:  Improrted from description, if not present import from summary, or null
* tags: Imported from tags
* featured_image: Imported from image or default to /images/or_logo.png
* draft: No import, set to false
* showToc: No import, set to false

## Writing imported files.

Each imported post should be written as an mdx file to the blog directory at @/content/posts

Each post should be named with the pattern `YYYY-MM-DD-slug.mdx` where:

`YYYY-MM-DD` is derrived from the post date.
`slug` is the slug of the post.
