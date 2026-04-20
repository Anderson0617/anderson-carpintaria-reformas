import { useEffect, useMemo, useRef, useState } from 'react'
import AdminPanel, { updateByPath } from './components/AdminPanel'
import Carousel from './components/Carousel'
import ReviewSection from './components/ReviewSection'
import {
  SITE_PASSWORD,
  defaultDraftContent,
  defaultPublishedContent,
  defaultReviews,
  fixedGallerySections,
  serviceItems,
} from './data/siteData'
import { loadState, saveState } from './lib/storage'

const initialState = {
  draftContent: defaultDraftContent,
  publishedContent: defaultPublishedContent,
  reviews: defaultReviews,
}

function SectionDivider({ image, position = 'center' }) {
  return (
    <div className="section-divider">
      <div className="section-divider__glow" />
      <img src={image} alt="" loading="lazy" style={{ objectPosition: position }} />
    </div>
  )
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="section-copy">
      {eyebrow ? <p className="section-copy__label">{eyebrow}</p> : null}
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}

function ExtraGallery({ title, photos }) {
  return (
    <section className="panel extra-gallery">
      <div className="section-copy section-copy--tight">
        <p className="section-copy__label">Novas fotos</p>
        <h3>{title}</h3>
      </div>

      <div className="masonry-grid">
        {photos.length ? (
          photos.map((photo) => (
            <article className="masonry-card" key={photo.id}>
              <img src={photo.src} alt={photo.name || title} loading="lazy" />
              <div className="masonry-card__body">
                <strong>{photo.name || 'Nova foto'}</strong>
                <p>{photo.description || 'Espaço reservado para descrição futura.'}</p>
              </div>
            </article>
          ))
        ) : (
          <article className="masonry-card masonry-card--placeholder">
            <div className="masonry-card__body">
              <strong>Espaço pronto para novas imagens</strong>
              <p>Quando novas fotos forem adicionadas no painel ADM, a grade cresce automaticamente sem deixar vazios feios.</p>
            </div>
          </article>
        )}
      </div>
    </section>
  )
}

function App() {
  const [siteState, setSiteState] = useState(() => loadState(initialState))
  const [adminOpen, setAdminOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [publishMessage, setPublishMessage] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)
  const serviceGridRef = useRef(null)

  useEffect(() => {
    saveState(siteState)
  }, [siteState])

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      if (!mobileMenuRef.current?.contains(event.target)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const grid = serviceGridRef.current
    if (!grid || typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 720px)')
    let intervalId

    function startCarousel() {
      if (!mediaQuery.matches) {
        grid.scrollTo({ left: 0, behavior: 'auto' })
        return
      }

      intervalId = window.setInterval(() => {
        const firstCard = grid.querySelector('.service-card')
        if (!firstCard) {
          return
        }

        const cardWidth = firstCard.getBoundingClientRect().width
        const gridStyles = window.getComputedStyle(grid)
        const gap = Number.parseFloat(gridStyles.columnGap || gridStyles.gap || '0')
        const step = cardWidth + gap
        const maxScrollLeft = grid.scrollWidth - grid.clientWidth
        const nextScrollLeft = grid.scrollLeft + step

        grid.scrollTo({
          left: nextScrollLeft >= maxScrollLeft - 8 ? 0 : nextScrollLeft,
          behavior: 'smooth',
        })
      }, 3600)
    }

    function handleViewportChange() {
      window.clearInterval(intervalId)
      startCarousel()
    }

    startCarousel()
    mediaQuery.addEventListener('change', handleViewportChange)

    return () => {
      window.clearInterval(intervalId)
      mediaQuery.removeEventListener('change', handleViewportChange)
    }
  }, [])

  const publicReviewsCount = useMemo(
    () => siteState.reviews.filter((review) => review.status === 'approved').length,
    [siteState.reviews],
  )

  function getWhatsappLink(phone) {
    const digits = phone.replace(/\D/g, '')
    const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
    return `https://wa.me/${withCountryCode}`
  }

  function handleCreateReview(review) {
    setSiteState((current) => ({
      ...current,
      reviews: [
        ...current.reviews,
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          ...review,
        },
      ],
    }))
  }

  function handlePasswordSubmit(event) {
    event.preventDefault()

    if (passwordValue === SITE_PASSWORD) {
      setAdminOpen(true)
      setPasswordModalOpen(false)
      setPasswordValue('')
      setPasswordError('')
      return
    }

    setPasswordError('Senha incorreta.')
  }

  function handleTextChange(path, value) {
    setSiteState((current) => ({
      ...current,
      draftContent: updateByPath(current.draftContent, path, value),
    }))
  }

  function handleMediaReplace(key, value) {
    setSiteState((current) => {
      if (key === 'introVideo') {
        return {
          ...current,
          draftContent: updateByPath(current.draftContent, 'introVideo.media', value),
        }
      }

      return {
        ...current,
        draftContent: updateByPath(current.draftContent, `media.${key}`, value),
      }
    })
  }

  function handlePublish() {
    setSiteState((current) => ({
      ...current,
      publishedContent: structuredClone(current.draftContent),
    }))
    setPublishMessage('Alterações publicadas na página pública.')
    window.setTimeout(() => setPublishMessage(''), 2600)
  }

  function handleReviewStatusChange(id, status) {
    setSiteState((current) => ({
      ...current,
      reviews: current.reviews.map((review) => (review.id === id ? { ...review, status } : review)),
    }))
  }

  function handleReviewDelete(id) {
    setSiteState((current) => ({
      ...current,
      reviews: current.reviews.filter((review) => review.id !== id),
    }))
  }

  function handleAddExtraPhotos(category, items) {
    setSiteState((current) => ({
      ...current,
      draftContent: {
        ...current.draftContent,
        extraPhotos: {
          ...current.draftContent.extraPhotos,
          [category]: [...current.draftContent.extraPhotos[category], ...items],
        },
      },
    }))
  }

  function handleUpdateExtraPhoto(category, id, description) {
    setSiteState((current) => ({
      ...current,
      draftContent: {
        ...current.draftContent,
        extraPhotos: {
          ...current.draftContent.extraPhotos,
          [category]: current.draftContent.extraPhotos[category].map((item) =>
            item.id === id ? { ...item, description } : item,
          ),
        },
      },
    }))
  }

  function handleDeleteExtraPhoto(category, id) {
    setSiteState((current) => ({
      ...current,
      draftContent: {
        ...current.draftContent,
        extraPhotos: {
          ...current.draftContent.extraPhotos,
          [category]: current.draftContent.extraPhotos[category].filter((item) => item.id !== id),
        },
      },
    }))
  }

  const content = siteState.publishedContent
  const navItems = [
    ['Início', '#inicio'],
    ['Serviços', '#servicos'],
    ['Sobre', '#sobre'],
    ['Galeria', '#galeria'],
    ['Avaliações', '#avaliacoes'],
    ['Contato', '#contato'],
  ]
  const heroActions = [
    { label: 'Solicitar orçamento', href: '#contato', variant: 'primary' },
    {
      label: 'Falar no WhatsApp',
      href: getWhatsappLink(content.hero.whatsapp),
      variant: 'secondary',
    },
  ]

  return (
    <>
      <div className="site-shell">
        <div className="site-grid" />

        <header className="topbar">
          <div className="container topbar__content">
            <div className="brand-stack">
              <a href="#inicio" className="brand" onClick={() => setMobileMenuOpen(false)}>
                <span className="brand__label">Anderson</span>
                <span className="brand__name">Carpintaria e Reformas</span>
              </a>

              <div className="mobile-menu" ref={mobileMenuRef}>
                <button
                  type="button"
                  className={`mobile-menu__trigger ${mobileMenuOpen ? 'is-open' : ''}`}
                  aria-label="Abrir menu"
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen((current) => !current)}
                >
                  <span />
                  <span />
                  <span />
                </button>

                {mobileMenuOpen ? (
                  <nav className="mobile-menu__panel">
                    {navItems.map(([label, href]) => (
                      <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                        {label}
                      </a>
                    ))}
                  </nav>
                ) : null}
              </div>
            </div>

            <nav className="nav">
              {navItems.map(([label, href]) => (
                <a key={href} href={href}>
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main>
          <section className="hero section" id="inicio">
            <div className="container hero__content">
              <div className="hero__copy">
                <h1>{content.hero.title}</h1>
                <h2>{content.hero.headline}</h2>
                {content.hero.support ? <p>{content.hero.support}</p> : null}

                <div className="hero__actions">
                  {heroActions.map((button) => (
                    <a
                      key={button.label}
                      href={button.href}
                      className={`button ${button.variant === 'secondary' ? 'button--ghost' : 'button--primary'}`}
                      target={button.href.startsWith('https://') ? '_blank' : undefined}
                      rel={button.href.startsWith('https://') ? 'noreferrer' : undefined}
                    >
                      {button.label}
                    </a>
                  ))}
                </div>

                <dl className="hero__meta">
                  <div>
                    <dt>Atendimento</dt>
                    <dd>{content.hero.region}</dd>
                  </div>
                </dl>
              </div>

              <div className="hero__visual">
                <div className="portrait-ring">
                  <img src={content.media.presentationPhoto} alt="Anderson em apresentação profissional" />
                </div>
                <div className="video-card panel">
                  <video
                    src={content.introVideo.media}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                  />
                  <div className="video-card__copy">
                    <h3>{content.introVideo.quote}</h3>
                    <p>{content.introVideo.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="servicos">
            <div className="container">
              <SectionHeading
                eyebrow=""
                title="Atendimento dividido entre carpintaria, madeira, reformas e execução em alvenaria."
                text="A proposta do site é objetiva: apresentar com clareza as frentes de serviço, mostrar obra real e manter um visual profissional, limpo e forte."
              />

              <div className="service-grid" ref={serviceGridRef}>
                {serviceItems.map((item) => (
                  <article className="service-card panel" key={item}>
                    <span className="service-card__dot" />
                    <h3>{item}</h3>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section about" id="sobre">
            <div className="container about__content">
              <SectionHeading
                eyebrow="Sobre"
                title="Experiência prática de obra, organização e compromisso com o resultado."
                text={content.about.text}
              />
            </div>
          </section>

          <section className="section" id="galeria">
            <div className="container gallery-stack">
              <SectionHeading
                eyebrow="Galeria"
                title="Vitrine principal organizada por frente de serviço e por etapa de execução."
                text={`São ${fixedGallerySections.carpintaria.carousels.length + fixedGallerySections.alvenaria.carousels.length} carrosséis fixos com ordem preservada, mais áreas independentes para novas fotos.`}
              />

              <SectionDivider image={content.media.carpentryTop} position="center 38%" />

              <section className="gallery-section">
                <SectionHeading
                  eyebrow={fixedGallerySections.carpintaria.eyebrow}
                  title={fixedGallerySections.carpintaria.title}
                  text={fixedGallerySections.carpintaria.intro}
                />
                <div className="gallery-grid">
                  {fixedGallerySections.carpintaria.carousels.map((carousel) => (
                    <Carousel
                      key={carousel.id}
                      title={carousel.title}
                      description={carousel.description}
                      images={carousel.images}
                      altPrefix={carousel.title}
                    />
                  ))}
                </div>
              </section>

              <SectionDivider image={content.media.carpentryBottom} position="center 52%" />

              <ExtraGallery title="Novas fotos de carpintaria" photos={content.extraPhotos.carpintaria} />

              <SectionDivider image={content.media.masonryTop} position="center 48%" />

              <section className="gallery-section">
                <SectionHeading
                  eyebrow={fixedGallerySections.alvenaria.eyebrow}
                  title={fixedGallerySections.alvenaria.title}
                  text={fixedGallerySections.alvenaria.intro}
                />
                <div className="gallery-grid">
                  {fixedGallerySections.alvenaria.carousels.map((carousel) => (
                    <Carousel
                      key={carousel.id}
                      title={carousel.title}
                      description={carousel.description}
                      images={carousel.images}
                      altPrefix={carousel.title}
                    />
                  ))}
                </div>
              </section>

              <SectionDivider image={content.media.masonryBottom} position="center 40%" />

              <ExtraGallery title="Novas fotos de alvenaria e pedreiro" photos={content.extraPhotos.alvenaria} />
            </div>
          </section>

          <ReviewSection intro={content.reviewsIntro} reviews={siteState.reviews} onCreateReview={handleCreateReview} />
        </main>

        <footer className="footer section" id="contato">
          <div className="container footer__content">
            <div>
              <p className="section-copy__label">Contato</p>
              <h2>Anderson Carpintaria e Reformas</h2>
            </div>

            <div className="footer__contacts">
              <a href={getWhatsappLink(content.hero.whatsapp)} target="_blank" rel="noreferrer">
                WhatsApp: {content.hero.whatsapp}
              </a>
              <a href={`mailto:${content.hero.email}`}>E-mail: {content.hero.email}</a>
              <span>Atendimento: {content.hero.region}</span>
            </div>

            <p className="footer__closing">{content.footer.closing}</p>
          </div>

          <button
            type="button"
            className="admin-key"
            aria-label="Abrir acesso administrativo"
            onClick={() => setPasswordModalOpen(true)}
          >
            <span>⌘</span>
          </button>
        </footer>
      </div>

      {passwordModalOpen ? (
        <div className="password-modal">
          <div className="password-modal__backdrop" onClick={() => setPasswordModalOpen(false)} />
          <form className="password-modal__content panel" onSubmit={handlePasswordSubmit}>
            <p className="section-copy__label">Acesso restrito</p>
            <h3>Senha do ADM</h3>
            <input
              type="password"
              inputMode="numeric"
              value={passwordValue}
              onChange={(event) => setPasswordValue(event.target.value)}
              placeholder="Digite a senha"
            />
            <button type="submit" className="button button--primary button--full">
              Entrar
            </button>
            {passwordError ? <p className="form-feedback">{passwordError}</p> : null}
          </form>
        </div>
      ) : null}

      {adminOpen ? (
        <AdminPanel
          draftContent={siteState.draftContent}
          reviews={siteState.reviews}
          onClose={() => setAdminOpen(false)}
          onTextChange={handleTextChange}
          onMediaReplace={handleMediaReplace}
          onPublish={handlePublish}
          onReviewStatusChange={handleReviewStatusChange}
          onReviewDelete={handleReviewDelete}
          onAddExtraPhotos={handleAddExtraPhotos}
          onUpdateExtraPhoto={handleUpdateExtraPhoto}
          onDeleteExtraPhoto={handleDeleteExtraPhoto}
        />
      ) : null}

      {publishMessage ? <div className="publish-toast">{publishMessage}</div> : null}
    </>
  )
}

export default App
