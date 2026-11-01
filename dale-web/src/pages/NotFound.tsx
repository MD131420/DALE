import { PillButton } from '../components/ui'
import { useI18n } from '../i18n'

export function NotFound() {
  const { t, lp } = useI18n()
  return (
    <section className="section section--carbon not-found">
      <div className="container">
        <p className="kicker">{t.notFound.kicker}</p>
        <h1 className="display display--section">
          {t.notFound.title[0]}
          <br />
          {t.notFound.title[1]}
        </h1>
        <div className="not-found__cta">
          <PillButton href={lp('/')}>{t.notFound.back}</PillButton>
        </div>
      </div>
    </section>
  )
}
