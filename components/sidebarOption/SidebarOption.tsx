import React, { Fragment } from 'react'
import styles from './SidebarOption.module.scss'

interface Props {
    title: string;
    Icon: any;
}

const SidebarOption = ({ title, Icon }: Props) => {
    return (
        <div className={styles.sidebarOption}>

            {Icon ? (
                <Fragment>
                    <span>
                        {<Icon style={{ fontSize: '2.5rem' }} />}
                    </span>
                    <h4>{title}</h4>
                </Fragment>
            ): 
                <p>{title}</p>
            
            }
        </div>
    )
}

export default SidebarOption
