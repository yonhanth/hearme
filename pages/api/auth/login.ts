// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function login(req: NextApiRequest, res: NextApiResponse) {
  const scopes = [
    "user-read-playback-state",
    "user-read-recently-played",
  ].join(" ");

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI; // 例: http://localhost:3000/api/auth/callback
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  // クエリパラメータとして渡された uid を state として利用
  const uid = req.query.uid as string;
  if (!uid) {
    return res.status(400).send("User ID is missing");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId as string,
    scope: scopes,
    redirect_uri: redirectUri as string,
    state: uid,
  });

  const authUrl = "https://accounts.spotify.com/authorize?" + params.toString();
  res.redirect(authUrl);
}
