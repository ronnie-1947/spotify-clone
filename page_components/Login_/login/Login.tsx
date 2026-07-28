import React from 'react'
import styles from './Login.module.scss'
import Image from 'next/image'

import Button from '../../../components/button/External_link/Link'
import Label from '../../../components/label/Label'

import {redirectToLogin} from '../../../lib/spotify'

const Login = () => {

    // The /authorize url can only be built at click time -- the PKCE challenge is generated async
    const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        redirectToLogin()
    }

    return (
        <div className={styles.login}>
            <span className={styles.logo}>
                <Image src="/spotify_logo_white_big.png" alt="Spotify" height={150} width={500}/>
            </span>
            <div className={styles.login__container}>
                <Button onClick={handleLogin}>Login With Spotify</Button>
                <div>
                    <Label/>
                </div>
            </div>
        </div>
    )
}

export default Login