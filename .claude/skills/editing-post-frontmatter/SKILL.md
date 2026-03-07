---
name: editing-post-frontmatter
description: Use when creating, editing, or reviewing blog post frontmatter - especially excerpts, tags, or OpenGraph metadata. Use when placeholder values like "tag1" or "A brief description" appear. Use when adding new posts or publishing drafts.
---

# Editing Post Frontmatter

## Overview

Blog post frontmatter drives OpenGraph metadata, search indexing, tag pages, and preview cards. Getting it wrong means broken social sharing, inconsistent tag pages, and placeholder text visible to readers. This skill ensures frontmatter is complete, consistent, and optimized for sharing.

## When to Use

- Creating a new post or publishing a draft
- Reviewing frontmatter before committing
- User asks about tags, excerpts, or OG metadata
- Placeholder values detected (`tag1`, `tag2`, `A brief description`)

## Frontmatter Reference

```yaml
slug: post-slug                    # Required. Kebab-case, matches filename.
title: Post Title                  # Required. Sentence/title case.
date: 'YYYY-MM-DD'                # Required. ISO date string.
excerpt: >-                        # Required. See Excerpt Guidelines below.
  One to two sentences...
tags:                              # Required. See Tag Guidelines below.
  - Tag Name
featured_image: /images/file.webp  # Required. Used as OG image.
draft: false                       # Required. true hides from production builds.
showToc: false                     # Optional. Defaults to showing ToC.
```

**No explicit OG fields needed.** The site auto-generates `og:title`, `og:description`, `og:image`, Twitter cards, and JSON-LD from these fields via `src/lib/seo.ts`.

## Excerpt Guidelines

The excerpt serves triple duty: OG description, search result preview, and on-page summary.

**Rules:**
- 1-2 sentences, under 160 characters ideal (search engine display limit)
- Describe what the reader will learn or find, not what you did
- Avoid starting with "In this post..." or "This article..."
- Must make sense out of context (social media card, search result)
- Never leave as template placeholder

**Good:**
```yaml
excerpt: "Lockpicking, ranged combat simplification, grapple redesign, and a dev environment rebuild in the latest Iron, Blood & Omens devlog."
```

**Bad:**
```yaml
excerpt: "A brief description of your post that will appear in previews and summaries."
```

## Tag Guidelines

**MANDATORY: Before suggesting tags, run this command to list all existing tags:**

```bash
grep -rh "^  - " content/posts/*.mdx | sed 's/^[[:space:]]*- //' | sort | uniq -c | sort -rn
```

**Rules:**
- Reuse existing tags before creating new ones
- Title Case for multi-word tags (e.g., "DM Advice", "Game Development")
- Acronyms stay uppercase (e.g., "IBO", "DnD 5e")
- 2-4 tags per post is ideal
- Tags generate dedicated pages at `/tag/[tag]/` so consistency matters

**Established tags (check command above for current list):**

| Tag | Notes |
|-----|-------|
| DnD 5e | D&D 5th edition content |
| DM Advice | GM/DM guidance |
| Mechanics | Game mechanics discussion |
| House Rules | Custom rule modifications |
| Analysis | Data or design analysis |
| RPG Resources | Tools, references, resources |
| Philosophy | Design philosophy, theory |
| Community | Player/community topics |
| Rime of the Frostmaiden | RotF campaign content |
| Encounters | Encounter design |
| Lore | World lore, history |
| Shadowdark | Shadowdark RPG content |
| Monsters | Monster design/stats |
| IBO | Iron, Blood & Omens MUD |
| Game Development | Game dev process |
| Dev Log | Development diary entries |

**Note:** This table may drift. Always run the grep command to get the authoritative list.

## Pre-Publish Checklist

1. **No placeholders** - excerpt is not template default, tags are not `["tag1","tag2","tag3"]`
2. **Excerpt under 160 chars** - check with `echo -n "excerpt text" | wc -c`
3. **Tags exist** - ran grep command, reused existing tags where possible
4. **Tag casing matches** - Title Case, consistent with existing usage
5. **featured_image set** - path exists in `/public/images/`
6. **slug matches filename** - `2026-03-06-my-post.mdx` has `slug: my-post`

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Leaving template placeholder excerpt | Write a real 1-2 sentence summary |
| Creating new tag when existing one fits | Run grep command first, reuse |
| Inconsistent casing (`GameDev` vs `Game Development`) | Use Title Case, match existing |
| Excerpt too long for OG cards | Keep under 160 chars |
| Missing featured_image | Set one; it's used as OG image fallback |
