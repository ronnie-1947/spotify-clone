import React from 'react'
import styles from './Link.module.scss'

interface Props {
    children: React.ReactNode;
    link: string;
}

const Link = ({link, children}:Props) => {
    return (
        <a className={styles.btn} href={link}>
            {children}
        </a>
    )
}

export default Link
