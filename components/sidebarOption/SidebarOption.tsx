import React, { Fragment } from 'react'
import styles from './SidebarOption.module.scss'

interface Props {
    title: string
    Icon: any
    highlight: boolean
    clickHandler : (id: string)=>void
    id: string
}

const SidebarOption = ({ title, Icon, highlight , clickHandler, id}: Props) => {
    return (
        <div onClick={()=>clickHandler(id)} className={`${styles.sidebarOption} ${highlight&& styles.sidebarOption_highlight}`}>

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
