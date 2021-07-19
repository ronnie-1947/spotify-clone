import React from 'react'
import styles from './Login.module.scss'
import Image from 'next/image'

import Button from '../../../components/button/External_link/Link'
import Label from '../../../components/label/Label'

import {loginUrl} from '../../../lib/spotify'

const Login = () => {
    return (
        <div className={styles.login}>
            <span className={styles.logo}>
                <Image src="/spotify_logo_white_big.png" height={150} width={500}/>
            </span>
            <div className={styles.login__container}>
                <Button link={loginUrl}>Login With Spotify</Button>
                <div>
                    <Label/>
                </div>
            </div>
        </div>
    )
}

export default Login