import React from 'react'
import styles from './Link.module.scss'

interface Props {
    children: React.ReactNode;
    link?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Link = ({link, onClick, children}:Props) => {
    return (
        <a className={styles.btn} href={link ? link : '#'} onClick={onClick}>
            {children}
        </a>
    )
}

export default Link
