import React, { Fragment, useEffect, useState } from 'react'
import styles from './Layout.module.scss'

import { useRouter } from 'next/router'

import {
    clearAuthParams,
    clearTokens,
    exchangeCodeForToken,
    getAuthCode,
    getAuthError,
    getValidAccessToken,
} from '../lib/spotify'
import spotify from '../lib/api_spotify'
import { useStateContextValue } from '../context/StateProvider'

import Spinner from '../components/loading/Loading'

interface Props {
    children: React.ReactNode;
}

// How often we check whether the access token is close to expiring
const REFRESH_INTERVAL = 5 * 60 * 1000


const Common = ({ children }: Props) => {

    const router = useRouter()
    const [{}, dispatch] = useStateContextValue()
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        let refreshTimer: ReturnType<typeof setInterval>

        const goToLogin = () => {
            if (router.pathname !== '/login') {
                router.push('/login')
            }
            setLoading(false)
        }

        // Authorization Code flow with PKCE: Spotify sends us back a ?code=... to exchange for tokens
        const resolveAccessToken = async (): Promise<string | null> => {

            if (getAuthError()) {
                clearAuthParams()
                clearTokens()
                return null
            }

            const code = getAuthCode()

            if (code) {
                try {
                    const access_token = await exchangeCodeForToken(code)
                    clearAuthParams()
                    return access_token
                } catch (err) {
                    clearAuthParams()
                    clearTokens()
                    return null
                }
            }

            return getValidAccessToken()
        }

        resolveAccessToken().then(access_token => {

            if (!access_token) {
                goToLogin()
                return
            }

            spotify.setAccessToken(access_token)
            spotify.getMe().then(user => {

                // Store the user and token
                dispatch({
                    type: 'SET_USER_N_TOKEN',
                    payload: {
                        user,
                        token: access_token
                    }
                })

                // Keep the token fresh while the app stays open
                refreshTimer = setInterval(() => {
                    getValidAccessToken().then(token => {
                        if (token) {
                            spotify.setAccessToken(token)
                        }
                    })
                }, REFRESH_INTERVAL)

                if (router.pathname !== '/') {
                    router.push('/')
                }
                setLoading(false)

                //  Get the users playlist
                spotify.getMyCurrentPlayingTrack().then((song:any)=>{
                    if(!song){
                        return
                    }

                    // console.log(song)
                })
                spotify.searchPlaylists('discover weekly').then( async ({playlists}:any)=>{
                    if(!playlists)return
                    const id = playlists?.items?.[0]?.id

                    const tracks = await spotify.getPlaylist(id?id:'37i9dQZEVXcKatfd95a3vi')
                    // const tracks = await spotify.getPlaylist('15ngsvOmlTkARCg7ipoNvG')

                    dispatch({
                        type: 'SET_ACTIVE_PLAYLIST',
                        active_playlist: tracks
                    })
                })
                spotify.getFeaturedPlaylists().then((playlists)=>{
                    dispatch({
                        type: 'SET_PLAYLISTS',
                        playlists
                    })
                })

            }).catch(err => {

                clearTokens()
                goToLogin()

            })

        })

        return () => {
            if (refreshTimer) {
                clearInterval(refreshTimer)
            }
        }

    }, [dispatch])


    if (loading) {
        return (
            <div className={styles.full_background}>
                <Spinner />
            </div>
        )
    }

    return (
        <Fragment>
            {children}
        </Fragment>
    )
}

export default Common
