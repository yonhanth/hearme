// Spotifyログイン処理
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const scopes = ['user-read-recently-played', 'user-read-playback-state']
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    scope: scopes.join(' '),
  })

  res.redirect('https://accounts.spotify.com/authorize?' + params.toString())
}
