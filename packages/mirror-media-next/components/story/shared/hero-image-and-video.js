import CustomImage from '@readr-media/react-image'
import styled from 'styled-components'
/**
 * @typedef {import('../../../apollo/fragments/post').HeroImage &
 * {
 *  id: string,
 *  resized: {
 *    original: string,
 *    w480: string,
 *    w800: string,
 *    w1200: string,
 *    w1600: string,
 *    w2400: string
 *  }
 * } } HeroImage
 */

/**
 * @typedef {import('../../../apollo/fragments/video').HeroVideo } HeroVideo
 */

const ArticleTitle = styled.h1`
  color: rgba(0, 0, 0, 0.87);
  font-size: 24px;
  font-family: var(--notoserifTC-font);
  font-weight: 700;
  text-align: center;
  margin: 20px 10px 0;
  display: block;
  width: auto;
  max-width: 800px;
  ${({ theme }) => theme.breakpoint.md} {
    position: absolute;
    left: 50%;
    bottom: calc(100% - 100vh);
    transform: translate(-50%, 0%);
    color: rgba(255, 255, 255, 0.87);
    margin: 0 auto;
    width: 90vw;
    margin-bottom: 10vh;
    max-width: 800px;
    font-size: 36px;
    line-height: 52px;
  }
  ${({ theme }) => theme.breakpoint.xl} {
    font-size: 40px;
    line-height: 1.5;
  }
`

const Figure = styled.figure`
  margin: 0 0 0;
  height: 100%;
  position: relative;
  video {
    width: 100%;
    height: 100vh;
    object-position: center center;
  }
  .readr-media-react-image {
    width: 100%;
    height: 100vh;
    object-position: center center;
  }
  .empty {
    width: 100%;
    height: 100vh;
    background-color: #d9d9d9;
  }
  ${
    /**
     * @param {Object} param
     * @param {boolean} param.shouldShowMask
     */
    ({ shouldShowMask }) =>
      shouldShowMask &&
      `&::after {
      content: ' ';
      position: absolute;
      display: block;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100vh;
      background: linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15)
      );
    }`
  }
  ${({ theme }) => theme.breakpoint.md} {
    margin: 0 0 0;
  }
`
const Empty = styled.div`
  margin: 0 0 0;
  width: 100%;
  height: 100vh;
  background-color: #d9d9d9;
`
const HeroCaption = styled.figcaption`
  display: block;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.8;
  font-weight: 400;
  color: #9f9f9f;
  margin: 12px auto 0;
  padding: 0 20px;
  max-width: 680px;
  text-align: center;
  ${({ theme }) => theme.breakpoint.md} {
    font-size: 14px;
  }
`

/**
 * Component for rending hero image of hero video.
 * This component is currently used at story page wide and premium layout.
 * This component will change it style by `props.style`.
 * If `props.style` is `wide`, component will render style for story page wide layout.
 * If `props.style` is `premium`, component will render style for story page premium layout.
 * There are three difference between 'wide' and `premium`:
 * 1. In `wide`, there is a `<h1>` in middle of bottom of component. In `premium`, there is no `<h1>` have to render.
 * 2. In `wide`, there is a semitransparent mask above image or video. In `premium`, there is no `<h1>` have to render.
 * 3. In `wide`, there is full-size block with gray background if no image and video is selected.  In `premium`, there is no have to render a full-size block.
 * @param {Object} props
 * @param {'wide' | 'premium'} [props.style] - The style of the component, it will change the components style by assigning different value.
 * @param {HeroImage | null} props.heroImage - The hero image data.
 * @param {HeroVideo | null} props.heroVideo - The hero video data.
 * @param {string} props.heroCaption - The caption for the hero image or video.
 * @param {string} [props.title] - The title of the article. Optional, only render if `props.style` is wide
 * @returns {JSX.Element}
 */
export default function HeroImageAndVideo({
  heroImage = null,
  heroVideo = null,
  heroCaption = '',
  title = '',
  style = 'wide',
}) {
  const shouldShowHeroVideo = Boolean(heroVideo)
  const shouldShowHeroImage = Boolean(!shouldShowHeroVideo && heroImage)

  const heroJsx = () => {
    if (shouldShowHeroVideo) {
      return (
        <video
          preload="metadata"
          controlsList="nodownload"
          playsInline={true}
          controls={true}
          poster={heroVideo?.heroImage?.resized?.original}
          src={heroVideo.urlOriginal}
        />
      )
    } else if (shouldShowHeroImage) {
      return (
        <CustomImage
          images={heroImage.resized}
          loadingImage={'/images/loading@4x.gif'}
          defaultImage={'/images/default-og-img.png'}
          alt={heroCaption ? heroCaption : title}
          objectFit={'cover'}
          width={''}
          height={''}
          rwd={{ mobile: '100vw', default: '100vw' }}
          priority={true}
        />
      )
    }
    return null
  }

  return (
    <>
      {shouldShowHeroImage || shouldShowHeroVideo ? (
        <Figure shouldShowMask={style === 'wide'}>
          {heroJsx()}
          {heroCaption ? <HeroCaption>{heroCaption}</HeroCaption> : null}
        </Figure>
      ) : (
        <>{style === 'wide' ? <Empty /> : null}</>
      )}
      {style === 'wide' && title ? <ArticleTitle>{title}</ArticleTitle> : null}
    </>
  )
}