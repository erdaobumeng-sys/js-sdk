import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

/* ===== 設定 ===== */

// 管理者 userId
const ADMINS = new Set([
  "Uxxxxxxxxxxxxxxxxxxxx" // ←自分のuserId
  ]);

  // ミュート管理
  const mutedUsers = new Map();

  // 環境変数
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

  // デフォルトミュート時間（分）
  const DEFAULT_MUTE_MIN = 10;

  /* ===== 共通関数 ===== */

  function isAdmin(userId) {
    return ADMINS.has(userId);
    }

    function isMuted(userId) {
      const until = mutedUsers.get(userId);
        if (!until) return false;
          if (Date.now() > until) {
              mutedUsers.delete(userId);
                  return false;
                    }
                      return true;
                      }

                      async function reply(replyToken, text) {
                        try {
                            await fetch("https://api.line.me/v2/bot/message/reply", {
                                  method: "POST",
                                        headers: {
                                                "Content-Type": "application/json",
                                                        Authorization: `Bearer ${ACCESS_TOKEN}`
                                                              },
                                                                    body: JSON.stringify({
                                                                            replyToken,
                                                                                    messages: [{ type: "text", text }]
                                                                                          })
                                                                                              });
                                                                                                } catch (err) {
                                                                                                    console.error("Reply error:", err);
                                                                                                      }
                                                                                                      }

                                                                                                      /* ===== イベント処理 ===== */

                                                                                                      async function handleEvent(event) {
                                                                                                        if (event.type !== "message") return;
                                                                                                          if (event.message.type !== "text") return;

                                                                                                            const text = event.message.text.trim();
                                                                                                              const userId = event.source.userId;
                                                                                                                const replyToken = event.replyToken;

                                                                                                                  // ミュート中は完全無視
                                                                                                                    if (isMuted(userId)) return;

                                                                                                                      // ===== 管理者コマンド =====
                                                                                                                        if (isAdmin(userId)) {

                                                                                                                            // /mute Uxxxx 10
                                                                                                                                if (text.startsWith("/mute")) {
                                                                                                                                      const [, targetId, min] = text.split(" ");
                                                                                                                                            if (!targetId) {
                                                                                                                                                    reply(replyToken, "使い方: /mute ユーザーID 分数");
                                                                                                                                                            return;
                                                                                                                                                                  }

                                                                                                                                                                        const minutes = Number(min) || DEFAULT_MUTE_MIN;
                                                                                                                                                                              mutedUsers.set(
                                                                                                                                                                                      targetId,
                                                                                                                                                                                              Date.now() + minutes * 60 * 1000
                                                                                                                                                                                                    );

                                                                                                                                                                                                          reply(replyToken, `ユーザーを ${minutes} 分ミュートしました`);
                                                                                                                                                                                                                return;
                                                                                                                                                                                                                    }

                                                                                                                                                                                                                        // /unmute Uxxxx
                                                                                                                                                                                                                            if (text.startsWith("/unmute")) {
                                                                                                                                                                                                                                  const [, targetId] = text.split(" ");
                                                                                                                                                                                                                                        mutedUsers.delete(targetId);
                                                                                                                                                                                                                                              reply(replyToken, "ミュート解除しました");
                                                                                                                                                                                                                                                    return;
                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                            // /status
                                                                                                                                                                                                                                                                if (text === "/status") {
                                                                                                                                                                                                                                                                      reply(replyToken, `ミュート中: ${mutedUsers.size} 人`);
                                                                                                                                                                                                                                                                            return;
                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                    // ===== 一般ユーザー =====
                                                                                                                                                                                                                                                                                      if (text.length > 300) {
                                                                                                                                                                                                                                                                                          reply(replyToken, "長文は控えてください");
                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                            /* ===== Webhook（最重要） ===== */

                                                                                                                                                                                                                                                                                            app.post("/webhook", (req, res) => {
                                                                                                                                                                                                                                                                                              // 🔥 最優先で200を返す（タイムアウト防止）
                                                                                                                                                                                                                                                                                                res.sendStatus(200);

                                                                                                                                                                                                                                                                                                  const events = req.body.events || [];
                                                                                                                                                                                                                                                                                                    for (const event of events) {
                                                                                                                                                                                                                                                                                                        handleEvent(event).catch(err => {
                                                                                                                                                                                                                                                                                                              console.error("Event error:", err);
                                                                                                                                                                                                                                                                                                                  });
                                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                                    });

                                                                                                                                                                                                                                                                                                                    /* ===== 起動確認 ===== */

                                                                                                                                                                                                                                                                                                                    app.get("/", (req, res) => {
                                                                                                                                                                                                                                                                                                                      res.send("LINE OC Bot running (no-timeout)");
                                                                                                                                                                                                                                                                                                                      });

                                                                                                                                                                                                                                                                                                                      const port = process.env.PORT || 3000;
                                                                                                                                                                                                                                                                                                                      app.listen(port, () => {
                                                                                                                                                                                                                                                                                                                        console.log("Listening on", port);
                                                                                                                                                                                                                                                                                                                        });