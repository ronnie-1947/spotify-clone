import React from 'react'
import styles from './MediaProgress.module.scss'

interface Props {
    playTime: number
    playTimeHandler: (event:any)=>void
}

const MediaProgress = ({playTime, playTimeHandler}:Props) => {

    // playTime is NaN until the preview's metadata lands (currentTime / NaN duration).
    const progress = Number.isFinite(playTime) ? Math.min(100, Math.max(0, playTime)) : 0

    return (
        <div
            onClick={playTimeHandler}
            className={styles.progress_container}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            tabIndex={0}
        >
            {/* Children are pointer-events: none so the click always lands on the
                container -- playTimeHandler measures offsetX against the full width,
                which the filled bar and the thumb would both report wrongly. */}
            <div className={styles.progress}>
                <div style={{width: `${progress}%`}} className={styles.progress__bar}>
                    <span className={styles.progress__thumb}></span>
                </div>
            </div>
        </div>
    )
}

export default MediaProgress
