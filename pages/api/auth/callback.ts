import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import cookie from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string;

  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
  });

  const tokenData = await tokenRes.json();
  console.log("🎧 Spotifyトークン:", tokenData);

  // 🔍 cookie から uid を取得
  const cookies = cookie.parse(req.headers.cookie || "");
  const uid = cookies.uid;

  if (!uid) {
    return res.status(401).json({ error: "No uid cookie found" });
  }

  const expiresAt = Date.now() + tokenData.expires_in * 1000;

  // 💾 Firestore に保存
  await adminDb.collection("users").doc(uid).collection("spotifyTokens").doc("token").set({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: expiresAt,
  });

  console.log(`✅ Firestoreにトークン保存完了 (uid: ${uid})`);

  // 🎉 ホームに戻す or 成功ページへ
  res.redirect("/");
}
