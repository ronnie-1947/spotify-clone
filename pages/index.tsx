import styles from '../styles/Home.module.scss'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import { getAccessCode } from '../lib/spotify'
import Loading from '../components/loading/Loading'

interface Token {
  access_token: string | undefined;
  expires_in: string | undefined;
  token_type: string | undefined;
}

export default function Home() {

  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {

    const { access_token}: Token = getAccessCode()
    window.location.hash = ''

    if (access_token) { setToken(access_token) }
    else { router.push('/login') }

  }, [setToken])


  if (!token) {
    return (
      <div className={styles.full_background}>
        <Loading/>
      </div>
    )
  }

  return (
    <main className={styles.main}>
      <h1>We are making Spotify Clone 🚀</h1>
    </main>
  )
}
