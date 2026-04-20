import { useEffect, useState } from 'react'

function Carousel({ title, description, images, altPrefix }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, 4200)

    return () => window.clearInterval(interval)
  }, [images.length])

  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  return (
    <article className="gallery-carousel">
      <header className="section-copy section-copy--tight">
        <p className="section-copy__label">{title}</p>
        <h3>{description}</h3>
      </header>

      <div className="carousel-frame" aria-label={title}>
        {images.map((image, index) => (
          <figure
            key={`${title}-${index}`}
            className={`carousel-slide ${index === activeIndex ? 'is-active' : ''}`}
          >
            <img src={image} alt={`${altPrefix} ${index + 1}`} loading="lazy" />
          </figure>
        ))}
      </div>

      <div className="carousel-dots" aria-label={`Indicadores do carrossel ${title}`}>
        {images.map((_, index) => (
          <button
            key={`${title}-dot-${index}`}
            type="button"
            aria-label={`Ir para imagem ${index + 1}`}
            className={index === activeIndex ? 'is-active' : ''}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </article>
  )
}

export default Carousel
