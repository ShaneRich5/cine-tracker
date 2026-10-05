This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Showtime data

Showtimes come from small connectors in `connectors/` (Alamo so far, NYC only). A GitHub Actions workflow
(`.github/workflows/fetch-showtimes.yml`) runs them hourly, or on demand from the Actions tab, and commits the
snapshot to the `data` branch. The app only reads that snapshot.

```bash
npm run fetch -- --dry-run   # show what would change, write nothing
npm run fetch                # write the snapshot to .data/
DATA_DIR=.data npm run dev   # run the app on it
```

Without a data source configured the app uses mock data (a frozen clock matching the design mockups).

| Variable             | Purpose                                                           |
| -------------------- | ----------------------------------------------------------------- |
| `DATA_DIR`           | Read the snapshot from a local folder, such as `.data`            |
| `GITHUB_DATA_REPO`   | `owner/repo` holding the `data` branch, for deployed environments |
| `GITHUB_DATA_TOKEN`  | Read-only token for that repo (the repo is private)               |
| `GITHUB_DATA_BRANCH` | Branch to read, default `data`                                    |

Add a theater to `connectors/theaters.json`. Add a source by writing a `fetchTheater` and a pure `parse`
(see `connectors/alamo/`), with a saved real payload under `fixtures/` for its test.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
