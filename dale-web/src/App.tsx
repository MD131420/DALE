import { Fragment, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import { Footer } from './components/Footer'
import { Header, type HeaderHandle } from './components/Header'
import { langFromPath, LangProvider, PREFIXES, stripLang, useI18n } from './i18n'
import { IntroBlueprint } from './motion/IntroBlueprint'
import { EASE_OUT, prefersReducedMotion } from './motion/math'
import { CURTAIN_COVER_S, PageCurtain } from './motion/PageCurtain'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { ProcessPage } from './pages/ProcessPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ServicesPage } from './pages/ServicesPage'
import { getLenis, scrollTop, setLenis } from './site'

// The admin panel is a separate chunk — visitors never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'))

type Stage = 'intro' | 'revealed' | 'done'

// A visitor who picked Polish or German lands on that version when opening the bare home page.
try {
  const pref = localStorage.getItem('dale-lang')
  if (location.pathname === '/' && (pref === 'pl' || pref === 'de')) history.replaceState(null, '', `/${pref}${location.search}`)
} catch {
  /* storage unavailable */
}

// The intro plays on a fresh load of a home page. `?nointro` skips it (handy while editing).
const shouldPlayIntro = () =>
  stripLang(location.pathname) === '/' && !prefersReducedMotion() && !new URLSearchParams(location.search).has('nointro')

function Site() {
  const [stage, setStage] = useState<Stage>(() => (shouldPlayIntro() ? 'intro' : 'done'))
  const headerRef = useRef<HeaderHandle>(null)
  const location = useLocation()
  const { lang, t, page } = useI18n()

  useEffect(() => {
    history.scrollRestoration = 'manual'
    const lenis = new Lenis({ autoRaf: true, lerp: 0.085, wheelMultiplier: 0.95 })
    setLenis(lenis)
    return () => {
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  // Lock scrolling while the intro owns the screen.
  useEffect(() => {
    const lenis = getLenis()
    if (stage === 'intro') {
      scrollTop()
      lenis?.stop()
      document.documentElement.classList.add('is-intro')
    } else {
      lenis?.start()
      document.documentElement.classList.remove('is-intro')
    }
  }, [stage])

  useEffect(() => {
    document.documentElement.lang = lang
    if (page.startsWith('/projects/')) return // the project page sets its own title
    document.title = t.meta.titles[page] ?? t.meta.notFound
  }, [lang, page, t])

  const getTarget = useCallback(() => headerRef.current?.getLogoTarget() ?? null, [])
  const onReveal = useCallback(() => setStage('revealed'), [])
  const onDone = useCallback(() => setStage('done'), [])
  const revealed = stage !== 'intro'

  return (
    <>
      <Header ref={headerRef} logoVisible={stage === 'done'} revealed={revealed} />
      <AnimatePresence mode="wait" onExitComplete={scrollTop}>
        <motion.div
          key={location.pathname}
          className="page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: CURTAIN_COVER_S, ease: 'linear' } }}
        >
          <LangProvider lang={langFromPath(location.pathname)}>
            <main>
              <Routes location={location}>
                {PREFIXES.map((pre) => (
                  <Fragment key={pre || 'en'}>
                    <Route path={pre || '/'} element={<Home revealed={revealed} />} />
                    <Route path={`${pre}/about`} element={<AboutPage />} />
                    <Route path={`${pre}/services`} element={<ServicesPage />} />
                    <Route path={`${pre}/projects`} element={<ProjectsPage />} />
                    <Route path={`${pre}/projects/:slug`} element={<ProjectDetailPage />} />
                    <Route path={`${pre}/process`} element={<ProcessPage />} />
                    <Route path={`${pre}/contact`} element={<ContactPage />} />
                  </Fragment>
                ))}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </LangProvider>
        </motion.div>
      </AnimatePresence>
      <PageCurtain />
      {stage !== 'done' && <IntroBlueprint labels={t.intro} getTarget={getTarget} onReveal={onReveal} onDone={onDone} />}
    </>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={null}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route path="*" element={<Site />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
