import React, {useState} from 'react'
import styles from './Player_body.module.scss'
import { useStateContextValue } from '../../context/StateProvider'

import Playlist from './playlist/Playlist'
import Header from '../../components/header/Header'
import Search from './search/Search'
import Library from './library/Library'


const Player = () => {

    const [{user, current_page}] = useStateContextValue()
    const [search, setSearch] = useState<string>('')

    return (
        <div className={styles.body}>
            <Header search={search} setSearch={setSearch} user={user} />
            {
                current_page === 'home'|| current_page === 'playlist'? <Playlist/>: current_page === 'search'? <Search searchStr={search}/>: current_page === 'library'? <Library/> :null
            }
            
        </div>
    )
}

export default Player