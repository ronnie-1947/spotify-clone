import styles from './Header.module.scss'
import React from 'react'
import {SearchOutlined} from '@material-ui/icons'
import {Avatar} from '@material-ui/core'

interface Props {
    user: {
        images: {url:string}[];
        display_name: string;
    }
}

const Header = ({user}:Props) => {
    

    // console.log(user)

    return (
        <header className={styles.header}>
            <div className={styles.header__left}>
                <SearchOutlined/>

                <input type="text" placeholder="Search for Artists, Songs"/>
            </div>
            <div className={styles.header__right}>
                <Avatar src={user?.images[0]?.url} alt={user.display_name.trim()}/>
                <h4>{user?.display_name?.length > 15? user.display_name.substring(0, 15).trim() + '...': user.display_name.trim()}</h4>
            </div>
        </header>
    )
}

export default Header
