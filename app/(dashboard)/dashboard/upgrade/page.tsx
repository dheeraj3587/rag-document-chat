'use client'
import Pricing from '@/app/pricing'
import Header from '@/app/(dashboard)/components/header'

const Upgrade = () => {
  const amount = 20
  return (
    <div>
        <Header name="Upgrade"/>
        <Pricing/>
    </div>
  )
}



export default Upgrade