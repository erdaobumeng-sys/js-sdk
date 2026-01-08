import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

/* ===== 設定 ===== */

// 管理者（userId）
const ADMINS = new Set([
  "Uxxxxxxxxxxxxxxxxxxxx", // ← 自分の userId
  ]);

  // ミュート情報
  // userId -> mute解除時刻（ms）
  const mutedUsers = new Map();

  // LINE設定（Renderの環境変数に入れる）
  const CHANNEL_SECRET = process.env.CHANNEL_SECRET;
  const ACCESS_TOKEN   = process.env.ACCESS_TOKEN;

  // ミュート時間（分）
  const DEFAULT_MUTE_MIN = 10;

  /* ===== ユーティリティ ===== */

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
                        await fetch("https://api.line.me/v2/bot/message/reply", {
                            method: "POST",
                                headers: {
                                      "Content-Type": "application/json",
                                            "Authorization": `Bearer ${ACCESS_TOKEN}`
                                                },
                                                    body: JSON.stringify({
                                                          replyToken,
                                                                messages: [{ type: "text", text }]
                                                                    })
                                                                      });
                                                                      }

                                                                      /* ===== Webhook ===== */

                                                                      app.post("/webhook", async (req, res) => {
                                                                        const events = req.body.events || [];

                                                                          for (const event of events) {
                                                                              if (event.type !== "message") continue;
                                                                                  if (event.message.type !== "text") continue;

                                                                                      const text = event.message.text.trim();
                                                                                          const userId = event.source.userId;
                                                                                              const replyToken = event.replyToken;

                                                                                                  /* ミュート中 */
                                                                                                      if (isMuted(userId)) {
                                                                                                            continue;
                                                                                                                }

                                                                                                                    /* ===== 管理者コマンド ===== */

                                                                                                                        if (isAdmin(userId)) {

                                                                                                                              // ミュートコマンド
                                                                                                                                    // 例: /mute Uxxxx 10
                                                                                                                                          if (text.startsWith("/mute")) {
                                                                                                                                                  const [, targetId, min] = text.split(" ");
                                                                                                                                                          if (!targetId) {
                                                                                                                                                                    await reply(replyToken, "使い方: /mute ユーザーID 分数");
                                                                                                                                                                              continue;
                                                                                                                                                                                      }

                                                                                                                                                                                              const minutes = Number(min) || DEFAULT_MUTE_MIN;
                                                                                                                                                                                                      mutedUsers.set(
                                                                                                                                                                                                                targetId,
                                                                                                                                                                                                                          Date.now() + minutes * 60 * 1000
                                                                                                                                                                                                                                  );

                                                                                                                                                                                                                                          await reply(
                                                                                                                                                                                                                                                    replyToken,
                                                                                                                                                                                                                                                              `ユーザーを ${minutes} 分ミュートしました`
                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                              continue;
                                                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                                                          // ミュート解除
                                                                                                                                                                                                                                                                                                // /unmute Uxxxx
                                                                                                                                                                                                                                                                                                      if (text.startsWith("/unmute")) {
                                                                                                                                                                                                                                                                                                              const [, targetId] = text.split(" ");
                                                                                                                                                                                                                                                                                                                      mutedUsers.delete(targetId);
                                                                                                                                                                                                                                                                                                                              await reply(replyToken, "ミュート解除しました");
                                                                                                                                                                                                                                                                                                                                      continue;
                                                                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                                                                  // 状態確認
                                                                                                                                                                                                                                                                                                                                                        if (text === "/status") {
                                                                                                                                                                                                                                                                                                                                                                await reply(
                                                                                                                                                                                                                                                                                                                                                                          replyToken,
                                                                                                                                                                                                                                                                                                                                                                                    `ミュート中: ${mutedUsers.size} 人`
                                                                                                                                                                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                                                                                                                                                                                    continue;
                                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                                                                                                  /* ===== 一般ユーザー ===== */

                                                                                                                                                                                                                                                                                                                                                                                                                      // スパムっぽい連投対策（簡易）
                                                                                                                                                                                                                                                                                                                                                                                                                          if (text.length > 300) {
                                                                                                                                                                                                                                                                                                                                                                                                                                await reply(replyToken, "長文は控えてください");
                                                                                                                                                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                                                                                        res.sendStatus(200);
                                                                                                                                                                                                                                                                                                                                                                                                                                        });

                                                                                                                                                                                                                                                                                                                                                                                                                                        /* ===== 起動 ===== */

                                                                                                                                                                                                                                                                                                                                                                                                                                        app.get("/", (req, res) => {
                                                                                                                                                                                                                                                                                                                                                                                                                                          res.send("LINE OC Bot running");
                                                                                                                                                                                                                                                                                                                                                                                                                                          });

                                                                                                                                                                                                                                                                                                                                                                                                                                          const port = process.env.PORT || 3000;
                                                                                                                                                                                                                                                                                                                                                                                                                                          app.listen(port, () => {
                                                                                                                                                                                                                                                                                                                                                                                                                                            console.log("Listening on", port);
                                                                                                                                                                                                                                                                                                                                                                                                                                            });