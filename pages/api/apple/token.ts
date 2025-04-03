// pages/api/apple/token.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!teamId || !keyId || !privateKey) {
    return res.status(500).json({ error: "環境変数が不足しています" });
  }

  try {
    const token = jwt.sign({}, privateKey, {
      algorithm: "ES256",
      expiresIn: "180d", // 最大6ヶ月
      issuer: teamId,
      header: {
        alg: "ES256",
        kid: keyId,
      },
    });

    return res.status(200).json({ token });
  } catch (error) {
    console.error("❌ Developer Token生成エラー:", error);
    return res.status(500).json({ error: "トークン生成に失敗しました" });
  }
}
