## Favicon: "Pi" Pie

1. Generate a 512x512 PNG via imagegen (premium for text legibility): a circular pie chart icon with bold "Pi" lettering centered, using the app's editorial palette (cream background, deep ink, warm accent slice). Save to `public/favicon.png`.
2. Delete `public/favicon.ico` so browsers don't fall back to it.
3. Update `index.html` `<link rel="icon">` to `/favicon.png` with `type="image/png"`.

No other files touched.