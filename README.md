# canaan-worship-flow-printer

Apps Script web app **敬拜流程 填寫工具** for Canaan church worship-flow entry and export.

## Google Sheet client

Yes — this project is **container-bound** to a Google Sheet:

- Spreadsheet: [敬拜流程 填寫工具](https://docs.google.com/spreadsheets/d/1dXXLSGjnoA2WDWyxfpk54RcVfmNHBjG_zahRsOJJzNo/edit)
- Script ID: `1JdAOzhdyA2Jx7uWBYG53tdVWGZNg8pjmYY-XSl5EnNY-hsRL5AES25Dw`
- Song library sheet: `SongDB`
- Chart PDFs: Drive folder `樂譜庫`

The Sheet is the data source; the Apps Script web app is the UI.

## Features

- Search songs / build worship flow
- Export Word / PDF flow sheet (copies Doc template before editing)
- **合成譜 PDF**: merge selected chart PDFs with **pdf-lib**

## Develop with clasp

```bash
npx clasp pull
npx clasp push
```
