import React from 'react'
import styles from './MediaProgress.module.scss'

interface Props {
    playTime: number
    playTimeHandler: (event:any)=>void
}

const MediaProgress = ({playTime, playTimeHandler}:Props) => {
    return (
        <div onClick={playTimeHandler} className={styles.progress_container}>
            <div className={styles.progress} onClick={playTimeHandler}>
                <div style={{width: `${playTime}%`}} className={styles.progress__bar}></div>
            </div>
        </div>
    )
}

export default MediaProgress
