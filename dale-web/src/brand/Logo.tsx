import { forwardRef, type SVGProps } from 'react'
import { LOGO_HEIGHT, LOGO_ORIGIN, LOGO_PATHS, PRIMARY_WIDTH, SIGNATURE_WIDTH } from './logoPaths'

export type LogoVariant = 'primary' | 'signature'

type Props = SVGProps<SVGSVGElement> & { variant: LogoVariant; title?: string }

/**
 * DALE mark drawn from the same contours as the intro animation,
 * so the canvas hand-off to the header is pixel-identical.
 * Width is set from CSS; height follows the viewBox.
 */
export const Logo = forwardRef<SVGSVGElement, Props>(function Logo(
  { variant, title = 'DALE — Product Development, Design & Engineering', ...rest },
  ref,
) {
  const width = variant === 'primary' ? PRIMARY_WIDTH : SIGNATURE_WIDTH
  const paths = variant === 'primary' ? LOGO_PATHS.slice(0, 4) : LOGO_PATHS
  return (
    <svg
      ref={ref}
      viewBox={`${LOGO_ORIGIN.x} ${LOGO_ORIGIN.y} ${width} ${LOGO_HEIGHT}`}
      fill="currentColor"
      role="img"
      aria-label={title}
      {...rest}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
})
