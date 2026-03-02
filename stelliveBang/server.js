const express = require("express");
const app = express();
const port = 3000;

// static 폴더 연결
app.use(express.static("public"));

const streamers = [
  { name: "아야츠노 유니", id: "45e71a76e949e16a34764deb962f9d9f" },
  { name: "사키하네 후야", id: "36ddb9bb4f17593b60f1b63cec86611d" },
  { name: "시라유키 히나", id: "b044e3a3b9259246bc92e863e7d3f3b8" },
  { name: "네네코 마시로", id: "4515b179f86b67b4981e16190817c580" },
  { name: "아카네 리제", id: "4325b1d5bbc321fad3042306646e2e50" },
  { name: "아라하시 타비", id: "a6c4ddb09cdb160478996007bff35296" },
  { name: "텐코 시부키", id: "64d76089fba26b180d9c9e48a32600d9" },
  { name: "아오쿠모 린", id: "516937b5f85cbf2249ce31b0ad046b0f" },
  { name: "하나코 나나", id: "4d812b586ff63f8a2946e64fa860bbf5" },
  { name: "유즈하 리코", id: "8fd39bb8de623317de90654718638b10" },
];

async function checkLive(channelId) {
  try {
    // 라이브 정보
    const liveRes = await fetch(
      `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://chzzk.naver.com",
          "Origin": "https://chzzk.naver.com",
        },
      }
    );

    const liveData = await liveRes.json();
    const live = liveData.content;

    // 채널 정보 (프로필용)
    const channelRes = await fetch(
      `https://api.chzzk.naver.com/service/v1/channels/${channelId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://chzzk.naver.com",
        },
      }
    );

    const channelData = await channelRes.json();
    const channel = channelData.content;

    const isLive = live && live.status === "OPEN";

    return {
      status: isLive ? "live" : "offline",
      viewers: isLive ? live.concurrentUserCount || 0 : 0,
      title: isLive ? live.liveTitle || "" : "",
      category: isLive ? live.liveCategoryValue || "" : "",
      thumbnail: channel.channelImageUrl,
    };
  } catch (err) {
    console.error(err);
    return { status: "offline" };
  }
}

// 🔥 이미지 프록시 (라이브 썸네일 404 해결용)
app.get("/image", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send("No URL");

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "Referer": "https://chzzk.naver.com",
        "Origin": "https://chzzk.naver.com",
      },
    });

    if (!response.ok) {
      return res.status(404).send("Image fetch failed");
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", response.headers.get("content-type"));
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).send("Image error");
  }
});

// API
app.get("/api", async (req, res) => {
  const results = await Promise.all(
    streamers.map(async (s) => {
      const result = await checkLive(s.id);
      return { name: s.name, ...result };
    })
  );

  results.sort((a, b) => {
    if (a.status === "live" && b.status !== "live") return -1;
    if (a.status !== "live" && b.status === "live") return 1;
    return 0;
  });

  res.json(results);
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});