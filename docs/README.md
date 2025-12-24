# ShiftSync GitHub Pages Setup

This folder contains the website files for ShiftSync, including Privacy Policy and Terms of Service.

## How to Enable GitHub Pages

1. **Push this repository to GitHub:**
   ```bash
   git add .
   git commit -m "Add GitHub Pages website"
   git push origin master
   ```

2. **Enable GitHub Pages in your repository:**
   - Go to your GitHub repository
   - Click on **Settings**
   - Scroll down to **Pages** section (in the left sidebar)
   - Under **Source**, select:
     - Branch: `master` (or `main`)
     - Folder: `/docs`
   - Click **Save**

3. **Wait a few minutes** for GitHub to build your site

4. **Your site will be available at:**
   ```
   https://yourusername.github.io/shiftsync/
   ```

5. **Update the URLs in your app:**
   - Replace `yourusername` in `src/screens/SettingsScreen.js` with your actual GitHub username
   - The URLs should be:
     - Privacy Policy: `https://yourusername.github.io/shiftsync/privacy.html`
     - Terms of Service: `https://yourusername.github.io/shiftsync/terms.html`

## Files Included

- `index.html` - Landing page for ShiftSync
- `privacy.html` - Privacy Policy
- `terms.html` - Terms of Service
- `.nojekyll` - Tells GitHub Pages not to process files with Jekyll

## Customization

Feel free to edit the HTML files to:
- Add your company logo
- Update contact information
- Modify styling/colors
- Add more content

## Testing Locally

To test the pages locally before pushing:
1. Open `docs/index.html` in your browser
2. Navigate to privacy.html and terms.html to verify links work

## Need Help?

If you have issues setting up GitHub Pages:
- Check GitHub's official documentation: https://docs.github.com/en/pages
- Ensure your repository is public (or you have GitHub Pro for private repo pages)
