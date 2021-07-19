import {Fragment} from 'react'
import styles from './Label.module.scss'

import FavoriteIcon from '@material-ui/icons/Favorite';

const Label = () => {
    return (
        <Fragment>
            <span className={styles.label}>Made with {<FavoriteIcon style={{fontSize: '2.2rem'}}/>} by Ripunjoy</span>
        </Fragment>
    )
}

export default Label
