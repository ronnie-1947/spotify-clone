import React from 'react'
import styles from './SongRow.module.scss'
import Image from 'next/image'

interface Props {
    track: any
}

const SongRow = ({track}: Props) => {

    console.log(track)
    return (
        <div className={styles.song}>
            <Image src={track?.album?.images[0].url} alt={track?.name} height={50} width={50} />
            <div className={styles.song__info}>
                <h1>{track.name}</h1>
                <p>
                    {track?.artists?.map((artist:{name:string})=> artist.name).join(', ')} 
                    - {track?.album?.name}
                </p>
            </div>
        </div>
    )
}

export default SongRow
