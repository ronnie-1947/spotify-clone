This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.tsx`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Where the audio comes from

Spotify withdrew 30-second `preview_url`s from apps without extended quota mode on
2024-11-27, and every track the Web API returns now has `preview_url: null`. Playback
therefore uses the free [iTunes Search API](https://performance-partners.apple.com/search-api)
instead: `/api/preview` looks a track up by artist, title and duration and hands back a
30s Apple preview, which the player plays alongside Spotify's metadata.

Matching is heuristic, so obscure releases resolve to nothing — those rows are dimmed
and labelled "preview unavailable" rather than hidden. Lookups happen at play time only
and are cached in `localStorage`, to stay inside iTunes' rate limit.

This is fine for a personal demo; it is not a basis for a commercial product. Full
background, including the rejected alternatives, is in
[docs/preview-fallback-plan.md](docs/preview-fallback-plan.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
