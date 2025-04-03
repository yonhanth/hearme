import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/router"; // ✅ 追加
import { auth } from "../lib/firebase";
import Cookies from "js-cookie";

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter(); // ✅ 追加

  useEffect(() => {
    document.body.style.backgroundColor = "#0f0f0f";
    document.body.style.color = "white";

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        console.log("✅ ログイン中:", firebaseUser);
      } else {
        setUser(null);
        console.log("👋 未ログイン");
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Googleログイン処理（＋クッキー保存 + 遷移）
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("✅ Firebaseログイン成功:", {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
      });

      // 🔐 クッキーにuidを保存（30分間有効）
      Cookies.set("uid", user.uid, { expires: 0.0208 });

      // ✅ マイページへ遷移
      router.push("/mypage");

    } catch (error) {
      console.error("❌ Firebaseログイン失敗:", error);
    }
  };

  // 🔓 ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("👋 ログアウト成功");
      Cookies.remove("uid");
    } catch (error) {
      console.error("❌ ログアウト失敗:", error);
    }
  };

  return (
    <>
      <Head>
        <title>HearMe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center bg-black">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
          HearMe
        </h1>
        <p className="text-gray-400 text-sm mb-10">あなたの音楽を、シェアしよう。</p>

        <div className="flex flex-col gap-5 w-full max-w-xs">
          {user ? (
            <>
              <div className="text-white text-center text-lg">
                <p>🎉 ようこそ、{user.displayName} さん！</p>
                <p className="text-sm text-gray-400 mt-1">{user.email}</p>
              </div>

              {/* Spotifyログインボタン */}
              <a
                href="/api/auth/login"
                className="w-full py-3 flex items-center justify-center gap-2 rounded-full text-lg font-semibold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg active:scale-95 transition"
              >
                <Image
                  src="/spotify-icon.svg"
                  alt="Spotify"
                  width={24}
                  height={24}
                />
                Spotifyでログイン
              </a>

              {/* Apple Musicボタン（準備中） */}
              <button
                disabled
                className="w-full py-3 flex items-center justify-center gap-2 rounded-full text-lg font-semibold bg-gradient-to-r from-pink-400 to-pink-600 text-white shadow-lg opacity-50 cursor-not-allowed"
              >
                <Image
                  src="/applemusic-icon.svg"
                  alt="Apple Music"
                  width={24}
                  height={24}
                />
                Apple Music（準備中）
              </button>

              {/* ログアウト */}
              <button
                onClick={handleLogout}
                className="mt-4 text-sm text-gray-400 underline hover:text-white"
              >
                ログアウト
              </button>
            </>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 flex items-center justify-center gap-2 rounded-full text-lg font-semibold bg-white text-black shadow-lg active:scale-95 transition"
            >
              <Image
                src="/google-icon.svg"
                alt="Google"
                width={24}
                height={24}
              />
              Googleでログイン
            </button>
          )}
        </div>
      </div>
    </>
  );
}
