Guide PDF Download Page

This project includes a public page at `/3-day-guide-book` that lets visitors download the tour guide PDF in the currently selected language (English, Portuguese, or Russian).

How it works

- The page reads the active language via i18n and maps it to one of three document slugs:
  - en → `/guide-en`
  - pt → `/guide-pt`
  - ru → `/guide-ru`
- When the user clicks “Download PDF”, the app fetches the file and triggers a local download.
- There is also an “Open in browser” link that opens the file directly.

Admin setup (one-time)

1. Go to Admin → Documents.
2. Upload each PDF and set the slugs exactly as follows:
   - English: `guide-en`
   - Portuguese: `guide-pt`
   - Russian: `guide-ru`
3. Save. The page will begin serving these files immediately.

Notes

- If a file has not been uploaded for a language, the page will show a toast error on download.
- You can replace/update files anytime in Admin → Documents without changing code.
