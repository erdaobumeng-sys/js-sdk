const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.json());

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

let game = {
  active: false,
    groupId: null,
      players: [],
        liar: null,
          votes: {},
          };

          async function reply(replyToken, text) {
            await fetch("https://api.line.me/v2/bot/message/reply", {
                method: "POST",
                    headers: {
                          "Content-Type": "application/json",
                                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                                    },
                                        body: JSON.stringify({
                                              replyToken,
                                                    messages: [{ type: "text", text }],
                                                        }),
                                                          });
                                                          }

                                                          async function push(userId, text) {
                                                            await fetch("https://api.line.me/v2/bot/message/push", {
                                                                method: "POST",
                                                                    headers: {
                                                                          "Content-Type": "application/json",
                                                                                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                                                                                    },
                                                                                        body: JSON.stringify({
                                                                                              to: userId,
                                                                                                    messages: [{ type: "text", text }],
                                                                                                        }),
                                                                                                          });
                                                                                                          }

                                                                                                          app.post("/webhook", async (req, res) => {
                                                                                                            const events = req.body.events || [];
                                                                                                              for (const e of events) {
                                                                                                                  if (e.type !== "message" || e.message.type !== "text") continue;

                                                                                                                      const text = e.message.text.trim();
                                                                                                                          const replyToken = e.replyToken;
                                                                                                                              const userId = e.source.userId;
                                                                                                                                  const groupId = e.source.groupId;

                                                                                                                                      // ===== コマンド =====
                                                                                                                                          if (text === "/liar start") {
                                                                                                                                                game = { active: true, groupId, players: [], liar: null, votes: {} };
                                                                                                                                                      await reply(replyToken, "🎭 嘘つきは誰だ 募集開始！ /join で参加");
                                                                                                                                                          } else if (text === "/join" && game.active && game.groupId === groupId) {
                                                                                                                                                                if (!game.players.includes(userId)) game.players.push(userId);
                                                                                                                                                                      await reply(replyToken, "✅ 参加しました");
                                                                                                                                                                          } else if (text === "/liar begin" && game.active) {
                                                                                                                                                                                if (game.players.length < 3) {
                                                                                                                                                                                        await reply(replyToken, "⚠️ 3人以上必要です");
                                                                                                                                                                                                continue;
                                                                                                                                                                                                      }
                                                                                                                                                                                                            game.liar = game.players[Math.floor(Math.random() * game.players.length)];
                                                                                                                                                                                                                  for (const id of game.players) {
                                                                                                                                                                                                                          if (id === game.liar) {
                                                                                                                                                                                                                                    await push(id, "🤥 あなたは【嘘つき】です。会話でバレないように！");
                                                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                                                      await push(id, "🗣 お題：【好きな食べ物】 正直に答えてください");
                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                          await reply(replyToken, "💬 会話スタート！投票は /vote userId");
                                                                                                                                                                                                                                                                              } else if (text.startsWith("/vote ") && game.active) {
                                                                                                                                                                                                                                                                                    const target = text.split(" ")[1];
                                                                                                                                                                                                                                                                                          game.votes[userId] = target;
                                                                                                                                                                                                                                                                                                await reply(replyToken, "🗳 投票しました");
                                                                                                                                                                                                                                                                                                    } else if (text === "/liar end" && game.active) {
                                                                                                                                                                                                                                                                                                          const result = {};
                                                                                                                                                                                                                                                                                                                for (const v of Object.values(game.votes)) result[v] = (result[v] || 0) + 1;
                                                                                                                                                                                                                                                                                                                      let max = 0, selected = null;
                                                                                                                                                                                                                                                                                                                            for (const id in result) if (result[id] > max) { max = result[id]; selected = id; }
                                                                                                                                                                                                                                                                                                                                  const win = selected === game.liar ? "🎉 正解！嘘つきを当てました！" : "💀 ハズレ！嘘つきの勝ち！";
                                                                                                                                                                                                                                                                                                                                        await reply(replyToken, win);
                                                                                                                                                                                                                                                                                                                                              game.active = false;
                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                                                                      res.sendStatus(200);
                                                                                                                                                                                                                                                                                                                                                      });

                                                                                                                                                                                                                                                                                                                                                      const PORT = process.env.PORT || 3000;
                                                                                                                                                                                                                                                                                                                                                      app.listen(PORT, () => console.log("嘘つきは誰だBOT 起動"));