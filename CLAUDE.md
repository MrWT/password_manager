# PasswordManager

## spec
相關開發細項，請查閱 @.docs/spec/idea.md

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server at http://localhost:3000 (opens automatically)
npm run build     # production build → build/
```

## Skills
- "session-chat-summary": 每次 session 結束前，必須執行一次 `/session-chat-summary` 以總結 session 討論內容 

# 專案規範
- 所有的程式都建立在 `src/` 底下
- 限制變更：你只能修改、新增或刪除 `src/` 目錄範圍內的檔案。
- 禁止越權：嚴禁讀取、修改或執行專案目錄之外的任何系統檔案與外部資料夾。