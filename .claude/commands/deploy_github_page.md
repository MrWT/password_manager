Deploy the current project to GitHub Pages. Follow these steps in order:

## Step 1 — Detect repo info

Run `git remote get-url origin` to get the remote URL. Extract:
- GitHub username (e.g. `my-user`)
- Repository name (e.g. `password-manager`)

If git remote is not set, stop and ask the user to run:
```
git remote add origin https://github.com/<username>/<repo>.git
```

## Step 2 — Check git status

Run `git status`. If there are uncommitted changes, warn the user and ask if they want to continue anyway. Do NOT commit or stash automatically.

## Step 3 — Ensure `gh-pages` is installed

Check `package.json` devDependencies for `gh-pages`. If missing, run:
```
npm install --save-dev gh-pages
```

## Step 4 — Set Vite `base` for GitHub Pages

Open `vite.config.js`. The `base` option must equal `/<repo-name>/` for GitHub Pages subdirectory hosting.

If `base` is already set to the correct value, skip. Otherwise add or update it:
```js
export default defineConfig({
  base: '/<repo-name>/',
  // ... rest of config
})
```

Remind the user: if this repo is deployed at a custom domain or as a user/org root page (`<username>.github.io`), `base` should be `'/'` instead.

## Step 5 — Add deploy script to `package.json`

Ensure `package.json` scripts contain:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d build"
```

If they already exist with correct values, skip.

## Step 6 — Run deploy

```
npm run deploy
```

This triggers `predeploy` (builds to `build/`) then pushes `build/` to the `gh-pages` branch.

## Step 7 — Report result

After success:
1. Tell the user the deploy is complete.
2. Print the GitHub Pages URL: `https://<username>.github.io/<repo-name>/`
3. Remind them to enable GitHub Pages in the repo settings:
   - Go to **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** / **root**
4. Note that it may take 1–2 minutes for the live URL to update.

If any step fails, show the error output and explain what went wrong before stopping.
