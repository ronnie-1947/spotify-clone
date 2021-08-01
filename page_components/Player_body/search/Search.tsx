import React, {useEffect, useState} from 'react'
import styles from './Search.module.scss'

import spotify from '../../../lib/api_spotify'
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
            
            if(!searchStr)return
            
            const artists: any = await spotify.searchArtists(searchStr)
            const albums: any = await spotify.searchAlbums(searchStr)
            const playlists: any = await spotify.searchPlaylists(searchStr)
            const shows: any = await spotify.searchShows(searchStr)
            

            setArtists(artists?.artists?.items)
            setAlbums(albums?.albums?.items)
            setPlaylists(playlists?.playlists?.items)
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
