import React from 'react'
import styles from './SongRow.module.scss'
import Image from 'next/image'

interface Props {
    track: any
    clickHandler: (track:any)=>void
}

const SongRow = ({track, clickHandler}: Props) => {
    
    if(!track?.preview_url) return null
    
    return (
        <div onClick={()=>clickHandler(track)} className={styles.song}>
            <Image src={track?.album?.images[0]?.url} alt={track?.name} height={50} width={50} />
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
