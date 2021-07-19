import styles from '../styles/Home.module.scss'
import React, { Fragment, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import SpotifyWebApi from 'spotify-web-api-js'

import { getAccessCode } from '../lib/spotify'
import Loading from '../components/loading/Loading'
import Player from '../page_components/Player/Player'

import {useStateContextValue} from '../context/StateProvider'

const spotify = new SpotifyWebApi()

interface Token {
  access_token: string | undefined;
  expires_in: string | undefined;
  token_type: string | undefined;
}

export default function Home() {

  const router = useRouter()
  const [{user, token}, dispatch] = useStateContextValue()

  useEffect(() => {
    
    const {access_token}: Token = getAccessCode()
    window.location.hash = ''
    
    if (token || access_token) {

      // Store the token
      access_token && dispatch({
        type: 'SET_TOKEN',
        payload: access_token
      })
      
      spotify.setAccessToken(token)
      spotify.getMe().then(user=> {
        
        // Store the user
        dispatch({
          type: 'SET_USER',
          payload: user
        })
      })
    }
    else { router.push('/login') }

  }, [dispatch])

  if (!token) {
    return (
      <div className={styles.full_background}>
        <Loading/>
      </div>
    )
  }

  return (
    <Fragment>
      <Player/>
    </Fragment>
  )
}