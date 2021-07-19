//https://developer.spotify.com/documentation/web-api/quick-start/

interface Token {
    access_token: string | undefined;
    expires_in: string | undefined;
    token_type: string | undefined;
}

export const authEndPoint: string = 'https://accounts.spotify.com/authorize'
const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_URI ? process.env.NEXT_PUBLIC_REDIRECT_URI : '')
const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
const scopes = [
    "user-read-currently-playing",
    "user-read-recently-played",
    "user-read-playback-state",
    "user-top-read",
    "user-modify-playback-state",
]

export const getAccessCode: () => Token = () => window.location.hash.substr(1).split('&').reduce((acc: any, cur) => {
    const [key, val] = cur.split('=')
    acc[key] = val ? decodeURIComponent(val) : null

    return acc
}, {})

export const loginUrl: string = `${authEndPoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`
