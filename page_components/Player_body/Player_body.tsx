import React from 'react'
import styles from './Player_body.module.scss'
import { useStateContextValue } from '../../context/StateProvider'

import Playlist from './playlist/Playlist'
import Header from '../../components/header/Header'


const Player = () => {

    const [{user, current_page}] = useStateContextValue()

    return (
        <div className={styles.body}>
            <Header user={user} />

            {
                current_page === 'home'|| current_page === 'playlist'? <Playlist/>:null
            }
            
        </div>
    )
}

export default Player