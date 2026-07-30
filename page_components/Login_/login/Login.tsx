import React, {useState} from 'react'
import styles from './Login.module.scss'
import Image from 'next/image'

import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import Button from '../../../components/button/External_link/Link'
import Label from '../../../components/label/Label'

import {redirectToLogin} from '../../../lib/spotify'

const DEMO_EMAIL = 'publicripunjoyshares@gmail.com'
const DEMO_PASSWORD = 'ilovespotify@1997'

const STEPS = [
    <>Hit <strong>Log in with Spotify</strong> below</>,
    <>Type in the <strong>email</strong> from the card above</>,
    <>Choose <strong>Log in with a password</strong></>,
    <>Type in the <strong>password</strong> from the card above</>,
    <>Hit <strong>Agree</strong> — and you&apos;re in 🎧</>,
]

interface CredentialProps {
    label: string;
    value: string;
}

const Credential = ({label, value}: CredentialProps) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch {
            // Clipboard needs a secure context -- the value is on screen either way
        }
    }

    return (
        <div className={styles.credential}>
            <span className={styles.credential__label}>{label}</span>
            <span className={styles.credential__value}>{value}</span>
            <button
                type="button"
                className={styles.credential__copy}
                onClick={handleCopy}
                aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
            >
                {copied
                    ? <CheckRoundedIcon style={{fontSize: '1.8rem'}}/>
                    : <ContentCopyRoundedIcon style={{fontSize: '1.8rem'}}/>}
            </button>
        </div>
    )
}

const Login = () => {

    // The /authorize url can only be built at click time -- the PKCE challenge is generated async
    const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        redirectToLogin()
    }

    return (
        <div className={styles.login}>
            <div className={styles.login__card}>
                <span className={styles.logo}>
                    <Image src="/spotify_logo_white_big.png" alt="Spotify" height={150} width={500} priority/>
                </span>

                <p className={styles.tagline}>
                    A Spotify web client clone. Spotify only lets approved accounts into a demo app,
                    so please sign in with the shared demo account below.
                </p>

                <div className={styles.creds}>
                    <span className={styles.creds__title}>Demo account</span>
                    <Credential label="Email" value={DEMO_EMAIL}/>
                    <Credential label="Password" value={DEMO_PASSWORD}/>
                </div>

                <ol className={styles.steps}>
                    {STEPS.map((step, index) => (
                        <li key={index} className={styles.steps__item}>
                            <span className={styles.steps__number}>{index + 1}</span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ol>

                <div className={styles.login__action}>
                    <Button onClick={handleLogin}>Login With Spotify</Button>
                </div>

                <p className={styles.note}>
                    <InfoOutlinedIcon style={{fontSize: '1.8rem'}}/>
                    <span>
                        Please use only the demo account — your own Spotify login will be turned away,
                        and nothing here is stored beyond your browser.
                    </span>
                </p>

                <div className={styles.login__footer}>
                    <Label/>
                </div>
            </div>
        </div>
    )
}

export default Login
