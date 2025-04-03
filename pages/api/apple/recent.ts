// pages/api/apple/recent.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uid } = req.query;

  if (!uid || typeof uid !== "string") {
    return res.status(400).json({ error: "Missing uid" });
  }

  // Firestore から music-user-token を取得
  const tokenDoc = await adminDb
    .collection("users")
    .doc(uid)
    .collection("appleMusic")
    .doc("token")
    .get();

  const data = tokenDoc.data();

  if (!data || !data.userToken) {
    return res.status(404).json({ error: "music-user-token not found" });
  }

  const developerToken = process.env.APPLE_DEVELOPER_TOKEN;
  const userToken = data.userToken;

  const resAM = await fetch("https://api.music.apple.com/v1/me/recent/played/tracks", {
    headers: {
      Authorization: `Bearer ${developerToken}`,
      "Music-User-Token": userToken,
    },
  });

  const result = await resAM.json();

  if (!result.data || result.data.length === 0) {
    return res.status(404).json({ error: "No recent tracks" });
  }

  // ランダムで1曲選ぶ
  const randomTrack = result.data[Math.floor(Math.random() * result.data.length)];

  const attributes = randomTrack.attributes;

  const track = {
    name: attributes.name,
    artist: attributes.artistName,
    image: attributes.artwork.url
      .replace("{w}", "600")
      .replace("{h}", "600"),
  };

  return res.status(200).json({ track });
}
