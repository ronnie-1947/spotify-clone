import React, {useEffect, useState} from 'react'
import styles from './Search.module.scss'

import spotify from '../../../lib/api_spotify'
import { getOwnPlaylists, usable } from '../../../lib/playlists'
import SearchRow from '../../../components/searchRow/SearchRow'

interface Props {
    searchStr: string
}

const Search = ({searchStr}:Props) => {

    const [artists, setArtists] = useState<any[]|null>(null)
    const [albums, setAlbums] = useState<any[]|null>(null)
    const [playlists, setPlaylists] = useState<any[]|null>(null)
    const [shows, setShows] = useState<any[]|null>(null)

    useEffect(()=>{

        const timer = setTimeout(async() => {
            
            if(!searchStr){
                // Featured playlists are gone from the Web API — the user's own
                // stand in as the landing state instead.
                const playlists: any = await getOwnPlaylists()
                const artists: any = await spotify.getMyTopArtists()

                setPlaylists(playlists)
                setArtists(artists?.items)
                return
            }
            
            const artists: any = await spotify.searchArtists(searchStr)
            const albums: any = await spotify.searchAlbums(searchStr)
            const playlists: any = await spotify.searchPlaylists(searchStr)
            const shows: any = await spotify.searchShows(searchStr)
            

            setArtists(artists?.artists?.items)
            setAlbums(albums?.albums?.items)
            // Spotify-owned hits come back as nulls, or as entries that 404 when opened
            setPlaylists(usable(playlists?.playlists?.items))
            setShows(shows?.shows?.items)

        }, 500);

        

        return ()=>{
            clearTimeout(timer)
        }
        
    }, [searchStr])


    return (
        <div>
            {artists && <SearchRow key='artists' row={artists?artists:[]} heading='artists'/>}
            {albums && <SearchRow key='albums' row={albums?albums:[]} heading='albums'/>}
            {playlists && <SearchRow key='playlists' row={playlists?playlists:[]} heading='playlists'/>}
            {shows && <SearchRow key='shows' row={shows?shows:[]} heading='shows'/>}
        </div>
    )
}

export default Search
