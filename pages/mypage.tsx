import { useAuthState } from "react-firebase-hooks/auth";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { getDoc, doc, deleteDoc } from "firebase/firestore";

export default function MyPage() {
  const [user, loading, error] = useAuthState(auth);
  const [spotifyLinked, setSpotifyLinked] = useState(false);
  const [appleLinked, setAppleLinked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log("🔥 useEffect 発火", user);

    const checkLinks = async () => {
      console.log("📞 checkLinks 実行");

      if (!user) {
        console.log("⚠️ user が存在しません");
        return;
      }

      try {
        const spotifyRef = doc(db, "users", user.uid, "spotifyTokens", "token");
        const appleRef = doc(db, "users", user.uid, "appleMusic", "token");

        console.log("📡 Firestore 参照作成完了");

        const spotifyDoc = await getDoc(spotifyRef);
        const appleDoc = await getDoc(appleRef);

        console.log("🧾 Spotify doc.exists():", spotifyDoc.exists());
        console.log("🧾 Apple doc.exists():", appleDoc.exists());

        // Spotify連携状態の判定
        if (spotifyDoc.exists()) {
          const data = spotifyDoc.data();
          console.log("✅ Spotifyドキュメント取得:", data);
          console.log("🕒 expires_at:", data?.expires_at, "現在:", Date.now());
          console.log("🎫 access_token:", data?.access_token);

          if (data?.access_token && data?.expires_at > Date.now()) {
            console.log("✅ Spotify連携状態: 有効");
            setSpotifyLinked(true);
          } else {
            console.log("⚠️ Spotifyトークン無効");
            setSpotifyLinked(false);
          }
        } else {
          console.log("❌ Spotifyドキュメントなし");
          setSpotifyLinked(false);
        }

        setAppleLinked(appleDoc.exists());
      } catch (error) {
        console.error("❌ Firestoreデータ取得エラー:", error);
      }
    };

    checkLinks();
  }, [user]);

  if (loading) return <p className="text-center text-gray-400">読み込み中...</p>;
  if (error) return <p className="text-center text-red-500">エラー: {error.message}</p>;
  if (!user) return <p className="text-center text-gray-400">ログインしてください</p>;

  const handleSpotifyUnlink = async () => {
    await deleteDoc(doc(db, "users", user.uid, "spotifyTokens", "token"));
    setSpotifyLinked(false);
  };

  const handleAppleUnlink = async () => {
    await deleteDoc(doc(db, "users", user.uid, "appleMusic", "token"));
    setAppleLinked(false);
  };

  const handleCopy = () => {
    const url = `https://hearme.vercel.app/u/${user.uid}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
        ようこそ、{user.displayName}さん！
      </h1>

      <p className="mb-4 text-gray-400">{user.email}</p>

      <div className="space-y-6 w-full max-w-md">
        {spotifyLinked ? (
          <div className="flex flex-col gap-4 bg-[#1DB954] p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Spotifyと連携済み</span>
              <button
                onClick={handleSpotifyUnlink}
                className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#1DB954]"
              >
                登録解除
              </button>
            </div>

            <div className="bg-white text-black px-4 py-2 rounded-lg text-sm flex items-center justify-between">
              <span className="truncate">
                {`https://hearme.vercel.app/u/${user.uid}`}
              </span>
              <button
                onClick={handleCopy}
                className="ml-4 bg-black text-white px-3 py-1 rounded-md text-xs hover:opacity-80 transition"
              >
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => (window.location.href = "/auth/spotify")}
            className="w-full py-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full text-white text-lg font-semibold shadow-md hover:shadow-lg active:scale-95 transition"
          >
            Spotifyで連携する
          </button>
        )}

        {appleLinked ? (
          <div className="flex justify-between items-center bg-[#fc3c44] p-4 rounded-xl shadow-lg">
            <span>Apple Musicと連携済み</span>
            <button
              onClick={handleAppleUnlink}
              className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#fc3c44]"
            >
              登録解除
            </button>
          </div>
        ) : (
          <button
            onClick={() => (window.location.href = "/auth/apple")}
            className="w-full py-3 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full text-white text-lg font-semibold shadow-md hover:shadow-lg active:scale-95 transition"
          >
            Apple Musicで連携する
          </button>
        )}
      </div>
    </div>
  );
}
