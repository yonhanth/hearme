// pages/u/[userid].tsx
import { GetServerSideProps } from "next";
import Image from "next/image";
import { adminDb } from "@/lib/firebaseAdmin";

type Track = {
  name: string;
  artist: string;
  image: string;
};

// ✅ 表示用コンポーネント
export default function UserNowPlaying({ track }: { track: Track | null }) {
  if (!track) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white text-center px-4">
        <p className="text-lg">再生履歴が取得できませんでした。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4 py-12">
      <Image
        src={track.image}
        alt={track.name}
        width={300}
        height={300}
        className="rounded-xl shadow-xl mb-6"
      />
      <h1 className="text-2xl font-bold mb-2">{track.name}</h1>
      <p className="text-lg text-gray-400">{track.artist}</p>
    </div>
  );
}

// ✅ サーバーサイドでデータ取得
export const getServerSideProps: GetServerSideProps = async (context) => {
  const userId = context.params?.userid as string;

  const tokenRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("spotifyTokens")
    .doc("token");

  const doc = await tokenRef.get();

  if (!doc.exists) {
    return { props: { track: null } };
  }

  let { access_token, refresh_token, expires_at } = doc.data() as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  // 🔁 トークンが期限切れならリフレッシュ
  if (Date.now() > expires_at) {
    console.log("♻️ アクセストークンをリフレッシュします");

    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const refreshRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
      }),
    });

    const refreshData = await refreshRes.json();

    if (refreshData.access_token) {
      access_token = refreshData.access_token;
      expires_at = Date.now() + refreshData.expires_in * 1000;

      await tokenRef.set(
        {
          access_token,
          expires_at,
        },
        { merge: true }
      );

      console.log("✅ トークン更新完了");
    } else {
      console.error("❌ トークン更新失敗:", refreshData);
      return { props: { track: null } };
    }
  }

  // 🎧 再生履歴取得
  const res = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=1",
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    return { props: { track: null } };
  }

  const trackData = data.items[0].track;
  const track: Track = {
    name: trackData.name,
    artist: trackData.artists[0].name,
    image: trackData.album.images[0].url,
  };

  return { props: { track } };
};
