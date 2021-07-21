import Layout from '../layout/Layout'
import styles from '../styles/Player.module.scss'

import Sidebar from '../page_components/sidebar/Sidebar'
import PlayerBody from '../page_components/Player_body/Player_body'
import Footer from '../page_components/footer/Footer'

export default function Home() {

  return (
    <Layout>
      <div className= {styles.player}>
            <div className={styles.player__body}>
                <Sidebar/>
                <PlayerBody/>
            </div>
            <Footer/>
        </div>
    </Layout>
  )
}