// pages/u/[userid].tsx
import { GetServerSideProps } from "next";
import Image from "next/image";
import { adminDb } from "@/lib/firebaseAdmin";

type Track = {
  name: string;
  artist: string;
  image: string;
};

type NowPlayingProps = {
  track: Track | null;
  displayName: string;
};

export default function UserNowPlaying({ track, displayName }: NowPlayingProps) {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      {/* ヘッダー部分：HearMeロゴとユーザー名の「is now playing」 */}
      <header className="absolute top-0 left-0 w-full p-4 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
          HearMe
        </h1>
        <p className="mt-2 text-lg">{displayName} is now playing</p>
      </header>

      {track ? (
        <>
          <Image
            src={track.image}
            alt={track.name}
            width={300}
            height={300}
            className="rounded-xl shadow-2xl mb-6"
          />
          <h2 className="text-2xl font-bold mb-2">{track.name}</h2>
          <p className="text-lg text-gray-400">{track.artist}</p>
        </>
      ) : (
        <p className="text-lg">再生履歴が取得できませんでした。</p>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 例: URL: /u/llpcBgh3vlOoDgNNBMCUbTQ5xkM2_John
  //    userParam = "llpcBgh3vlOoDgNNBMCUbTQ5xkM2_John"
  const userParam = context.params?.userid as string;
  // "_" で分割し、先頭をuidとして扱い、残りをdisplayNameとして結合
  const [uid, ...nameParts] = userParam.split("_");
  const displayName = nameParts.join("_") || "Unknown User";

  // まずは Firestore でトークンがあるか確認
  const tokenRef = adminDb
    .collection("users")
    .doc(uid)
    .collection("spotifyTokens")
    .doc("token");

  const docSnap = await tokenRef.get();

  if (!docSnap.exists) {
    // トークンがなければ再生履歴が取得できないので track:null
    return { props: { track: null, displayName } };
  }

  let { access_token, refresh_token, expires_at } = docSnap.data() as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  // トークンが期限切れの場合はリフレッシュ
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
      return { props: { track: null, displayName } };
    }
  }

  // Spotify API から再生履歴を取得
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
    return { props: { track: null, displayName } };
  }

  const trackData = data.items[0].track;
  const track: Track = {
    name: trackData.name,
    artist: trackData.artists[0].name,
    image: trackData.album.images[0].url,
  };

  return { props: { track, displayName } };
};
