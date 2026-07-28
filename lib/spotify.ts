//https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

export interface TokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
}

export const authEndPoint: string = 'https://accounts.spotify.com/authorize'
export const tokenEndPoint: string = 'https://accounts.spotify.com/api/token'

// Must match (character for character) one of the redirect URIs registered on the Spotify dashboard,
// and must be identical in the /authorize request and in the token exchange.
// NEXT_PUBLIC_VERCEL_URL wins when set (with or without protocol / trailing slash); otherwise we fall
// back to the origin the app is actually being served from, which is always the right answer here
// since the whole flow runs in the browser. Called lazily -- `window` does not exist during SSR.
export const getRedirectUri = (): string => {
    const configured = process.env.NEXT_PUBLIC_VERCEL_URL

    if (configured) {
        // localhost is served over http -- everything else (Vercel) over https
        const protocol = /^(localhost|127\.0\.0\.1)(:|$)/.test(configured) ? 'http://' : 'https://'
        const withProtocol = /^https?:\/\//.test(configured) ? configured : `${protocol}${configured}`
        return withProtocol.replace(/\/*$/, '/')
    }

    return `${window.location.origin}/`
}

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ? process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID : ''
const scopes = [
    "user-read-currently-playing",
    "user-read-recently-played",
    "user-read-playback-state",
    "user-top-read",
    "user-library-read",
    "user-modify-playback-state",
]

const VERIFIER_KEY = 'code_verifier'
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const EXPIRES_AT_KEY = 'expires_at'

// Refresh this many ms before the token actually expires
const EXPIRY_MARGIN = 60 * 1000


/* ---------------------------------- PKCE ---------------------------------- */

const VERIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

const randomVerifier = (length: number): string => {
    const values = window.crypto.getRandomValues(new Uint8Array(length))
    let verifier = ''
    for (let i = 0; i < values.length; i++) {
        verifier += VERIFIER_CHARS[values[i] % VERIFIER_CHARS.length]
    }
    return verifier
}

const base64UrlEncode = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const codeChallenge = async (verifier: string): Promise<string> => {
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
    return base64UrlEncode(digest)
}


/* --------------------------------- Storage -------------------------------- */

const storeTokens = (data: TokenResponse) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)
    // Spotify only returns a new refresh token sometimes -- keep the old one otherwise
    if (data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
    }
    localStorage.setItem(EXPIRES_AT_KEY, `${new Date().getTime() + data.expires_in * 1000}`)
}

export const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    localStorage.removeItem(VERIFIER_KEY)
}


/* ---------------------------------- Login --------------------------------- */

// Builds the /authorize url and stores the freshly generated verifier for the callback to use
export const buildLoginUrl = async (): Promise<string> => {
    const verifier = randomVerifier(64)
    localStorage.setItem(VERIFIER_KEY, verifier)

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: getRedirectUri(),
        scope: scopes.join(' '),
        code_challenge_method: 'S256',
        code_challenge: await codeChallenge(verifier),
        show_dialog: 'true',
    })

    return `${authEndPoint}?${params.toString()}`
}

export const redirectToLogin = async () => {
    window.location.href = await buildLoginUrl()
}


/* -------------------------------- Callback -------------------------------- */

export const getAuthCode = (): string | null => new URLSearchParams(window.location.search).get('code')

export const getAuthError = (): string | null => new URLSearchParams(window.location.search).get('error')

// Removes ?code=... / ?error=... from the address bar without a reload
export const clearAuthParams = () => {
    window.history.replaceState({}, document.title, window.location.pathname)
}

const requestToken = async (body: Record<string, string>): Promise<TokenResponse> => {
    const res = await fetch(tokenEndPoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body).toString(),
    })

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data?.error_description || data?.error || 'Token request failed')
    }

    return data as TokenResponse
}

export const exchangeCodeForToken = async (code: string): Promise<string> => {
    const verifier = localStorage.getItem(VERIFIER_KEY)

    if (!verifier) {
        throw new Error('Missing PKCE code verifier')
    }

    const data = await requestToken({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: verifier,
    })

    localStorage.removeItem(VERIFIER_KEY)
    storeTokens(data)

    return data.access_token
}


/* --------------------------------- Refresh -------------------------------- */

export const refreshAccessToken = async (): Promise<string | null> => {
    const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (!refresh_token) {
        return null
    }

    try {
        const data = await requestToken({
            client_id: clientId,
            grant_type: 'refresh_token',
            refresh_token,
        })

        storeTokens(data)

        return data.access_token
    } catch (err) {
        // The refresh token is dead -- the user has to log in again
        clearTokens()
        return null
    }
}

// Returns a usable access token, refreshing it first when it is expired (or about to be)
export const getValidAccessToken = async (): Promise<string | null> => {
    const access_token = localStorage.getItem(ACCESS_TOKEN_KEY)
    const expires_at = Number(localStorage.getItem(EXPIRES_AT_KEY))

    if (!access_token) {
        return refreshAccessToken()
    }

    if (expires_at && new Date().getTime() > expires_at - EXPIRY_MARGIN) {
        return refreshAccessToken()
    }

    return access_token
}
