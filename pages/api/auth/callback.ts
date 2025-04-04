// pages/api/auth/callback.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function callback(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      console.error("必要なパラメータが不足しています:", req.query);
      return res.status(400).send("Bad Request");
    }

    // Spotifyアクセストークン取得用のリクエスト
    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI as string, // 例: http://localhost:3000/api/auth/callback
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Spotifyトークン取得エラー:", tokenData);
      return res.status(400).send("Failed to obtain access token");
    }

    // stateパラメータからユーザーIDを取得（login.ts側でuidをstateとして渡す前提）
    const userId = state as string;
    if (!userId) {
      console.error("ユーザーIDが取得できませんでした");
      return res.status(400).send("User ID is missing");
    }

    // トークンの有効期限を計算（現在時刻 + expires_in（秒））
    const expiresAt = Date.now() + tokenData.expires_in * 1000;

    // Firestoreにトークン情報を保存
    const tokenRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("spotifyTokens")
      .doc("token");

    await tokenRef.set({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    });

    console.log("✅ Firestoreにトークン保存完了 (uid:", userId, ")");

    // 保存完了後、mypageへリダイレクト
    res.redirect("/mypage");
  } catch (error) {
    console.error("callbackエラー:", error);
    res.status(500).send("Internal Server Error");
  }
}
