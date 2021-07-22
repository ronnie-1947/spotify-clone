import React, { Fragment, useEffect, useState } from 'react'
import styles from './Layout.module.scss'

import { useRouter } from 'next/router'
import SpotifyWebApi from 'spotify-web-api-js'

import { getAccessCode } from '../lib/spotify'
import { useStateContextValue } from '../context/StateProvider'

import Spinner from '../components/loading/Loading'

const spotify = new SpotifyWebApi()

interface Props {
    children: React.ReactNode;
}

interface Token {
    access_token: string | undefined | null;
    expires_in: string | undefined;
    token_type: string | undefined;
} 


const Common = ({ children }: Props) => {

    const router = useRouter()
    const [{}, dispatch] = useStateContextValue()
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {   

        // Get Access Token from hash or local storage
        let { access_token }: Token = getAccessCode()

        if (!access_token) {
            access_token = localStorage.getItem('access_token')
        }

        window.location.hash = ''

        if (access_token) {

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
                
                // Store access_token in local Storage
                localStorage.setItem('access_token', access_token ? access_token : '')
                
                if (router.pathname !== '/') {
                    router.push('/')
                }
                setLoading(false)
                
                //  Get the users playlist
                spotify.searchPlaylists('discover weekly').then( async ({playlists}:any)=>{
                    if(!playlists)return
                    const id = playlists?.items?.[0]?.id
                    
                    const tracks = await spotify.getPlaylist(id?id:'37i9dQZEVXcKatfd95a3vi')
                    // const tracks = await spotify.getPlaylist('37i9dQZF1DX5trt9i14X7j')
                    
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
                
                localStorage.clear()
                if (router.pathname !== '/login') {
                    router.push('/login')
                }
                
            })

        }
        else {
            if (router.pathname !== '/login') {
                router.push('/login')
            }
            setLoading(false)
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
