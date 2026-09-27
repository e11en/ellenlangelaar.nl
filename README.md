[![Netlify Status](https://api.netlify.com/api/v1/badges/2bd74aa9-c851-4fa5-95a0-dba7320ef9c1/deploy-status)](https://app.netlify.com/sites/ellenlangelaar/deploys)


# ellenlangelaar.nl
My personal website

A small pixel art space game: walk (scroll, arrow keys or swipe) across a tiny planet and
click the stations to read about me, my skills, past projects, my blog and how to reach me.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to build/ (Netlify publish dir)
```

All texts live in `src/game/content.ts`; the pixel art is drawn in code in `src/game/sprites.ts`.
