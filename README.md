# Optional Rule Static Website Generators

This is website to publishe a static site for [Optional Rule Games](https://www.optionalrule.com) using [Next.js](https://nextjs.org).

## Development

To run dynamic builds in development use:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Draft Posts

Each post has an optional boolean gray matter field 'draft'. It will only publish a page during a static build if the draft property is set to false.

## Build and Deployment

This site generates a static site for hosting through [GitHub Pages](https://docs.github.com/en/pages).  

To run a build use:

```bash
npm run build
```

## NextJS Info

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Tailwindcss](https://tailwindcss.com/) - styling done through Tailwindcss.
