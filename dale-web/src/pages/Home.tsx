import { CtaBand, PageIndex } from '../components/PageLinks'
import { Hero } from '../sections/Hero'
import { Statement } from '../sections/Statement'

export function Home({ revealed }: { revealed: boolean }) {
  return (
    <>
      <Hero revealed={revealed} />
      <PageIndex />
      <Statement />
      <CtaBand />
    </>
  )
}
