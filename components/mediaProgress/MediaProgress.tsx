import React from 'react'
import styles from './MediaProgress.module.scss'

const MediaProgress = () => {
    return (
        <div className={styles.progress}>
            <div style={{width: '22%'}} className={styles.progress__bar}></div>
        </div>
    )
}

export default MediaProgress
