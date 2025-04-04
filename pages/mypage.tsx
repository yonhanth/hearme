// pages/mypage.tsx
import { useAuthState } from "react-firebase-hooks/auth";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { getDoc, doc, deleteDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function MyPage() {
  const [user, loading, error] = useAuthState(auth);
  const [spotifyLinked, setSpotifyLinked] = useState(false);
  const [appleLinked, setAppleLinked] = useState(false);
  const [copied, setCopied] = useState(false);
  // カスタムユーザー名を入力するための state
  const [customName, setCustomName] = useState("");
  const [nameSet, setNameSet] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkLinks = async () => {
      try {
        const spotifyRef = doc(db, "users", user.uid, "spotifyTokens", "token");
        const appleRef = doc(db, "users", user.uid, "appleMusic", "token");

        const spotifyDoc = await getDoc(spotifyRef);
        const appleDoc = await getDoc(appleRef);

        if (spotifyDoc.exists()) {
          const data = spotifyDoc.data();
          if (data?.access_token && data?.expires_at > Date.now()) {
            setSpotifyLinked(true);
          } else {
            setSpotifyLinked(false);
          }
        } else {
          setSpotifyLinked(false);
        }

        setAppleLinked(appleDoc.exists());
      } catch (error) {
        console.error("Firestoreデータ取得エラー:", error);
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
    // customName が設定されていれば URL に含める
    const shareUrl = nameSet
      ? `https://hearme.vercel.app/u/${user.uid}_${customName}`
      : `https://hearme.vercel.app/u/${user.uid}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("ログアウト失敗:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
        ようこそ、{user.displayName || "User"}さん！
      </h1>
      <p className="mb-4 text-gray-400">{user.email}</p>

      {/* ユーザーがカスタム名を入力できる欄（未設定の場合のみ表示） */}
      {!nameSet && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="表示したいユーザー名を入力"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="p-2 rounded-md text-black"
          />
          <button
            onClick={() => setNameSet(true)}
            className="ml-2 px-4 py-2 bg-green-600 rounded-md hover:bg-green-700"
          >
            決定
          </button>
        </div>
      )}

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
                {nameSet
                  ? `https://hearme.vercel.app/u/${user.uid}_${customName}`
                  : `https://hearme.vercel.app/u/${user.uid}`}
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
            onClick={() =>
              (window.location.href = `/api/auth/login?uid=${user.uid}`)
            }
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
            disabled
            className="w-full py-3 flex items-center justify-center gap-2 rounded-full text-lg font-semibold bg-gradient-to-r from-pink-400 to-pink-600 text-white shadow-lg opacity-50 cursor-not-allowed"
          >
            Apple Music（準備中）
          </button>
        )}
      </div>

      {/* ログアウトボタン */}
      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="underline text-sm text-gray-400 hover:text-white"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
