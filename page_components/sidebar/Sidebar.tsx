import React from 'react'
import styles from './Sidebar.module.scss'
import Image from 'next/image'

import SidebarOption from '../../components/sidebarOption/SidebarOption'
import { HomeOutlined, SearchOutlined, LibraryMusicOutlined } from '@material-ui/icons'
import { useStateContextValue } from '../../context/StateProvider'

const Sidebar = () => {

    const [{playlists}] = useStateContextValue()
    
    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebar__logoContainer}>
                <Image src="/spotify_logo_white_big.png" alt="spotify logo" height={70} width={170} />
            </div>
            <div>
                <SidebarOption title="Home" Icon={HomeOutlined} />
                <SidebarOption title="Search" Icon={SearchOutlined} />
                <SidebarOption title="Your Library" Icon={LibraryMusicOutlined} />
            </div>

            <br />

            <strong className={styles.sidebar__title}>PLAYLISTS</strong>
            <hr />

            <div className={styles.sidebar__playlists}>
                {
                    playlists?.playlists?.items?.map((playlist:{name:string})=>(
                        <SidebarOption key={playlist.name} title={playlist.name} Icon={null} />
                    ))
                }
            </div>
        </div>
    )
}

export default Sidebar
