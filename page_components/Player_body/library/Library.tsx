import React, {useEffect, useState} from 'react'
import styles from './Library.module.scss'
import spotify from '../../../lib/api_spotify'
import {useStateContextValue} from '../../../context/StateProvider'

import SearchRow from '../../../components/searchRow/SearchRow'

const Library = () => {

    const [{user}] = useStateContextValue()

    const [artists, setArtists] = useState<any[]|null>(null)
    const [albums, setAlbums] = useState<any[]|null>(null)
    const [playlist, setPlaylist] = useState<any[]|null>(null)

    const runFunc = async ()=>{
        const albums = await spotify.getMySavedAlbums()
        const topArtists = await spotify.getMyTopArtists()
        const playlist = await spotify.getUserPlaylists(user?.id)

        topArtists?.items?.length>0 && setArtists(topArtists?.items)
        albums?.items?.length>0 && setAlbums(albums?.items?.map(c=>c.album))
        playlist?.items?.length > 0 && setPlaylist(playlist?.items)
    }


    useEffect(()=>{
        runFunc()
    }, [])

    return (
        <div>
            {playlist && <SearchRow row={playlist?playlist:[]} heading="playlists" />}
            {albums && <SearchRow row={albums?albums:[]} heading="albums" />}
            {artists && <SearchRow row={artists?artists:[]} heading="artists"/>}
            
        </div>
    )
}

export default Library
