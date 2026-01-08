# 🐺 One Night Werewolf LINE Bot

LINEグループで遊べる  
**ワンナイト人狼（簡易版）BOT** です。

Cloudflare Workers + LINE Messaging API を使用しています。

---

## 🎮 遊び方

グループで以下のコマンドを送信します。
/start ゲーム開始
/join 参加
/begin 役職配布
/vote A 投票
/result 結果表示
---

## 🛠️ セットアップ

### 1. Cloudflare Workers

```bash
npm install -g wrangler
wrangler login
wrangler deploy