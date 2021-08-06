import styles from './Header.module.scss'
import React, { Fragment } from 'react'
import { SearchOutlined } from '@material-ui/icons'
import { Avatar } from '@material-ui/core'
import {useRouter} from 'next/router'

import { useStateContextValue } from '../../context/StateProvider'

interface Props {
    user: {
        images: { url: string }[]
        display_name: string
    }
    search: string
    setSearch: any
}

const Header = ({ user, search, setSearch}: Props) => {

    const [{ current_page }, dispatch] = useStateContextValue()
    const router = useRouter()

    const handleLogout = ()=>{

        localStorage.removeItem('access_token')
        dispatch({
            type: 'SET_USER_N_TOKEN',
            payload: {
                user: null,
                token: null
            }
        })
        router.push('/login')
    }

    return (
        <header className={styles.header}>
            {current_page === 'search' ? (
                <Fragment>
                    <div className={styles.header__left}>
                        <SearchOutlined />
                        <input type="search" value={search} onChange={(e:any)=> setSearch(e.target? e.target.value: '')} placeholder="Search for Artists, Songs and podcasts"/>
                    </div>
                </Fragment>
            ): <div></div>}
            {user && (
                <div className={styles.header__right}>
                    <Avatar src={user?.images[0]?.url} alt={user?.display_name.trim()} />
                    <h4>{user?.display_name?.length > 15 ? user.display_name.substring(0, 15).trim() + '...' : user.display_name.trim()}</h4>
                    <div className={styles.logout}>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Header
