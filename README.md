# Nafiz Khan portfolio

Public pages use HTML, CSS, and JavaScript. GitHub Pages can serve the public portfolio and its five original samples. The dashboard needs the Node server and a persistent SQLite data directory.

## Local preview

Install Node.js 24 or later. From this folder run:

```powershell
$env:OWNER_PASSWORD = Read-Host 'Choose a local passphrase (at least 20 characters)' -MaskInput
npm.cmd start
```

Open [the portfolio](http://127.0.0.1:4173/) or [the owner dashboard](http://127.0.0.1:4173/studio.html). With no owner passphrase, the portfolio runs with the dashboard disabled.

The dashboard starts with the existing samples. It can save drafts, publish or unpublish entries, and edit or delete them. Upload JPEG, PNG, or WebP photos up to 5 MB, paste writing or import a `.txt` file, and paste YouTube links for vlogs. Photo uploads are resized and re-encoded in the browser before submission. Published entries appear on Work or About. The home page shows the first three published samples.

Run `npm test` to exercise the HTTP routes, sessions, publishing, upload rules, and storage.

## Deploy the dashboard with the portfolio

Use a Node.js 24+ host with a persistent disk and HTTPS termination, or build the provided Dockerfile and deploy the image behind an HTTPS reverse proxy. Use one server instance with a persistent local filesystem for SQLite. Keep the Node port private to the HTTPS proxy. Configure an edge rate limit for `POST /api/session` to reduce the impact of public login traffic.

| Setting | Value |
| --- | --- |
| `SITE_ORIGIN` | Public HTTPS origin, with no path or trailing slash |
| `OWNER_PASSWORD_HASH` | Salted passphrase hash made with the command below |
| `PORT` | Port the host forwards traffic to, such as 8080 |
| `HOST` | Use `127.0.0.1` when the proxy shares the host. Use `0.0.0.0` inside the container or on a private host network. |
| `DATA_DIR` | Path to the persistent, writable disk or volume |

Generate the hash locally in PowerShell 7 and copy only the result into the hosting provider’s secret environment settings. Choose a unique, strong passphrase of at least 20 characters.

```powershell
Read-Host 'Owner passphrase' -MaskInput | node --input-type=module -e "import { randomBytes, scryptSync } from 'node:crypto'; import { readFileSync } from 'node:fs'; const password = readFileSync(0, 'utf8').replace(/\r?\n$/, ''); if (password.length < 20 || password.length > 256) throw Error('Use 20 to 256 characters'); const salt = randomBytes(16); console.log(salt.toString('hex') + ':' + scryptSync(password, salt, 64).toString('hex'));"
```

Set `SITE_ORIGIN` to your public address before starting the production server. Serve the dashboard and API on that same origin. Use the hosted dashboard to sign in, save a draft, and publish a test entry. Verify the public page in a signed-out browser and remove the test entry from the dashboard.

The `DATA_DIR` contains all managed content and photo files stored inside SQLite. Back up the SQLite database before a migration. Use SQLite’s online backup mechanism or stop the server before copying the database and any WAL files. Restoring a backup may restore older content.

The existing GitHub Pages address remains a static option. A Node host can serve both the site and dashboard under its own address or a domain you control.


## Google Form feedback

The feedback link points to the existing Google Form. The homepage can display the latest 20 responses that explicitly opt in to public display. It shows the display name and feedback only. The response spreadsheet stays private.

1. Open the Google Form and link its responses to a Google Sheet. Add a multiple-choice question called `Show my feedback on the portfolio?` with `Yes` and `No` options. Explain that Yes makes the visitor’s display name and feedback public.
2. In the linked Sheet, open **Extensions → Apps Script**. Replace the editor’s starter code with the full contents of `google-feedback.gs`. Adjust the tab and the two response headers at the top of the file to match the Sheet.
3. In Apps Script **Project Settings → Script properties**, add `RESPONSE_SPREADSHEET_ID` with the Sheet ID from its address (the part between `/d/` and `/edit`).
4. Choose **Deploy → New deployment → Web app**. Set it to execute as you and allow **Anyone** to access it. Copy the deployment’s `/exec` URL and add it as the `data-src` attribute of the `feedback-feed` iframe in `index.html`.
5. Upload `index.html` to GitHub Pages. Open the portfolio in a private window and submit a test response with **Yes**. Reload the portfolio to see it. To take a response off the display, change its consent cell to **No**. Earlier responses without a Yes remain private.

