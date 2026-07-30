import React from 'react'
import styles from './LibraryItem.module.scss'

import { Favorite, MusicNote, PushPin, AccessTime, PlayArrowRounded, PauseRounded } from '@mui/icons-material'
import type { LibraryItem as Item } from '../../lib/library'

interface Props {
    item: Item
    // This row's collection is the one open in the body
    active: boolean
    // This row's collection is the one the footer is playing
    playing: boolean
    onOpen: (item: Item) => void
    onPlay: (item: Item) => void
}

const LibraryItem = ({ item, active, playing, onOpen, onPlay }: Props) => {

    const handlePlay = (e: React.MouseEvent) => {
        // Without this the row's own onClick fires too and re-opens the collection
        e.stopPropagation()
        onPlay(item)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        onOpen(item)
    }

    return (
        <div
            role="button"
            tabIndex={0}
            aria-current={active}
            onClick={() => onOpen(item)}
            onKeyDown={handleKeyDown}
            className={`${styles.item} ${active ? styles.item_active : ''} ${playing ? styles.item_playing : ''}`}
        >
            <span className={`${styles.item__art} ${item.kind === 'liked' ? styles.item__art_liked : ''}`}>
                {
                    item.image ? (
                        <img src={item.image} alt={item.name} />
                    ) : item.kind === 'liked' ? (
                        <Favorite className={styles.item__artIcon} />
                    ) : (
                        <MusicNote className={styles.item__artIcon} />
                    )
                }

                <button
                    type="button"
                    onClick={handlePlay}
                    title={playing ? `Pause ${item.name}` : `Play ${item.name}`}
                    aria-label={playing ? `Pause ${item.name}` : `Play ${item.name}`}
                    className={styles.item__play}
                >
                    {
                        playing ? (
                            <PauseRounded className={styles.item__playIcon} />
                        ) : (
                            <PlayArrowRounded className={styles.item__playIcon} />
                        )
                    }
                </button>
            </span>

            <div className={styles.item__meta}>
                <p className={styles.item__name} title={item.name}>{item.name}</p>
                <p className={styles.item__sub}>
                    {item.pinned && <PushPin className={styles.item__pin} />}
                    {item.upcoming && <AccessTime className={styles.item__clock} />}
                    <span>{item.label}</span>
                    <span className={styles.item__dot}>•</span>
                    <span className={styles.item__detail} title={item.detail}>{item.detail}</span>
                </p>
            </div>

            {playing && (
                <span className={styles.item__bars} aria-hidden="true">
                    <i /><i /><i />
                </span>
            )}
        </div>
    )
}

export default LibraryItem
