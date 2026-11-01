import { NextPage } from '../components/PageLinks'
import { Services } from '../sections/Services'
import { Toolkit } from '../sections/Toolkit'

export function ServicesPage() {
  return (
    <>
      <Services />
      <Toolkit />
      <NextPage current="/services" />
    </>
  )
}
