import { NextPage } from '../components/PageLinks'
import { About } from '../sections/About'
import { Callouts } from '../sections/Callouts'

export function AboutPage() {
  return (
    <>
      <About />
      <Callouts />
      <NextPage current="/about" />
    </>
  )
}
