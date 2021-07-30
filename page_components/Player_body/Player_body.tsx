import React from 'react'
import styles from './Player_body.module.scss'
import { useStateContextValue } from '../../context/StateProvider'

import {PlayCircleFilled, PauseCircleOutlineOutlined} from '@material-ui/icons'
import Header from '../../components/header/Header'
import SongRow from '../../components/songRow/SongRow'


const Player = () => {

    const [{ user, active_playlist }] = useStateContextValue()

    // console.log(active_playlist)

    return (
        <div className={styles.body}>
            <Header user={user} />

            <div className={styles.body__info} >
                <span className={styles.body__info_img}>
                    {
                        active_playlist?.images?.[0]?.url ? (
                            <img src={active_playlist?.images?.[0]?.url} alt={user.display_name.trim()} />
                        ) : (
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIi8+" alt="transparent" />
                        )
                    }
                </span>
                <div className={styles.body__info_text}>
                    <strong>PLAYLIST</strong>
                    <h2>{active_playlist?.name}</h2>
                    <p>{active_playlist?.description}</p>
                </div>
            </div>

            <div className={styles.body__songs}>
                
                <div className={styles.body__icons}>
                    <PlayCircleFilled className={styles.icon} style={{fontSize: '5rem'}}/>
                </div>

                {
                    active_playlist?.tracks?.items.map((item:any, i:number)=>(
                        <SongRow key={i} track={item?.track}/>
                    ))
                }
            </div>
        </div>
    )
}

export default Player