import { useEffect, useState } from 'react'

function Carousel({ title, description, images }) {
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
        <h3 className="carousel__title">{title}</h3>
        <p className="carousel__description">{description}</p>
      </header>

      <div className="carousel-frame" aria-label={title}>
        {images.map((image, index) => (
          <figure
            key={`${title}-${index}`}
            className={`carousel-slide ${index === activeIndex ? 'is-active' : ''}`}
          >
                <img src={image.src} alt={image.alt} loading="lazy" />
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
