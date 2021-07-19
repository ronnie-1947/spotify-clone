import '../styles/globals.scss'
import {Fragment} from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Fragment>
      <Head>
        <title>Spotify Clone</title>
        <meta name="description" content="Spotify clone -- Built with NEXT JS and using the spotify API" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </Fragment>
  )
}
export default MyApp
