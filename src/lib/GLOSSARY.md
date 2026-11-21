# Publishing

The Optional Rule blog: authored writing about TTRPGs and game development, published as a static site. This is the host context that every Interactive sub-app hangs off.

## Language

### Content

**Post**:
A dated piece of writing published to the blog feed, identified by its Publish Date and Slug.
_Avoid_: Article, entry, blog

**Page**:
An undated, standalone piece of writing that sits outside the feed (e.g. About).
_Avoid_: Static page

**Draft**:
A Post or Page marked as unpublished; visible while authoring, excluded from the published site.
_Avoid_: Unpublished, hidden

**Frontmatter**:
The metadata block at the top of a Post or Page that declares its Title, Publish Date, Tags, and other attributes.
_Avoid_: Header, metadata

**Slug**:
The URL-safe name of a Post, Page, or Tag.

**Publish Date**:
The calendar date a Post belongs to; it orders the feed and forms part of the Permalink.
_Avoid_: Created date, timestamp

**Permalink**:
The stable, date-based address of a Post (`/year/month/day/slug/`).
_Avoid_: Post URL, link

### Summaries and presentation

**Excerpt**:
The short teaser shown for a Post in listings; taken from Frontmatter or derived from the opening of the Post.
_Avoid_: Summary, blurb

**Description**:
An optional search-and-share summary that overrides the Excerpt for search engines and social previews.
_Avoid_: Meta description

**Featured Image**:
The representative image of a Post, used in listings and social previews.
_Avoid_: Hero image, cover, thumbnail

**Reading Time**:
The estimated whole minutes needed to read a Post.

**Table of Contents**:
An opt-in, heading-derived outline shown alongside a Post or Page.
_Avoid_: TOC (in prose), outline

### Discovery

**Tag**:
A free-form topic label on a Post; matched case-insensitively and addressed by its Slug.
_Avoid_: Category, label, keyword

**Tag Page**:
The paginated listing of every Post carrying a given Tag.

**Feed**:
The reverse-chronological, paginated listing of all published Posts.
_Avoid_: Archive, index, timeline

**Search**:
Fuzzy lookup over published Posts by Title, Excerpt, and Tags, run entirely in the reader's browser.

**Search Index**:
The pre-built snapshot of published Posts that Search queries.

**RSS Feed**:
The syndication document listing published Posts for feed readers.
_Avoid_: Feed (unqualified; that means the on-site listing)

### Site structure

**Blog**:
The Publishing section of the site: the Feed, Tags, Search, and Pages.

**Interactive**:
The umbrella for the site's playable and usable sub-apps, split into Games and Tools.
_Avoid_: Interactive features, apps, widgets

**Game**:
An Interactive sub-app meant to be played (e.g. Asteroids).

**Tool**:
An Interactive sub-app meant to assist play or prep (e.g. Torch Tracker, Star System Generator, KCD2 Alchemy Scholar).
_Avoid_: Utility, generator (as a category)
