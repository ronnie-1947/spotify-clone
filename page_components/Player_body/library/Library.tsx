import React, {useEffect} from 'react'
import styles from './Library.module.scss'
import spotify from '../../../lib/api_spotify'

const Library = () => {

    const runFunc = async ()=>{
        const albums = await spotify.getMySavedAlbums()
        const topArtists = await spotify.getMyTopArtists()
        const shows = await spotify.getMySavedShows()
        const recently_played = await spotify.getMyRecentlyPlayedTracks()
    }

    useEffect(()=>{
        runFunc()
    }, [])

    return (
        <div>
            
        </div>
    )
}

export default Library
