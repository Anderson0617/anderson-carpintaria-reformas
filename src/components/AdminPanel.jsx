import { useEffect, useMemo, useState } from 'react'
import { fileToDataUrl } from '../lib/storage'
import { formatApproxRegion } from '../lib/location'

const TEXT_FIELDS = [
  ['Título principal', 'hero.title'],
  ['Frase principal', 'hero.headline'],
  ['Texto de apoio', 'hero.support'],
  ['WhatsApp', 'hero.whatsapp'],
  ['E-mail', 'hero.email'],
  ['Região', 'hero.region'],
  ['Texto da seção Sobre', 'about.text'],
  ['Título da seção Avaliações', 'reviewsIntro.title'],
  ['Frase do vídeo', 'introVideo.quote'],
  ['Texto complementar do vídeo', 'introVideo.description'],
  ['Texto de avaliações', 'reviewsIntro.text'],
  ['Frase final do rodapé', 'footer.closing'],
]

function updateByPath(source, path, value) {
  const keys = path.split('.')
  const next = structuredClone(source)
  let cursor = next

  keys.slice(0, -1).forEach((key) => {
    cursor = cursor[key]
  })

  cursor[keys.at(-1)] = value
  return next
}

function getByPath(source, path) {
  return path.split('.').reduce((accumulator, key) => accumulator[key], source)
}

function createEmptySelection() {
  return {
    publishGithub: false,
    publishSupabase: false,
    deleteGithub: false,
    deleteSupabase: false,
  }
}

function createSelectionForItem(item, currentSelection) {
  const next = createEmptySelection()

  if (item.isPublic) {
    next.deleteGithub = item.hasGithubRecord ? currentSelection?.deleteGithub === true : false
    next.deleteSupabase = item.isPublishedInSupabase ? currentSelection?.deleteSupabase === true : false
    return next
  }

  next.publishGithub = currentSelection?.publishGithub === true
  next.publishSupabase = currentSelection?.publishSupabase === true
  return next
}

function translateReviewStatus(status) {
  if (status === 'private') {
    return 'privado'
  }

  if (status === 'pending') {
    return 'pendente'
  }

  if (status === 'approved') {
    return 'público'
  }

  if (status === 'hidden') {
    return 'oculto'
  }

  return status
}

function getDestinationStatusLabel(item, selection) {
  if (item.isPublic) {
    const markedToDelete = []

    if (selection?.deleteGithub) {
      markedToDelete.push('GitHub')
    }

    if (selection?.deleteSupabase) {
      markedToDelete.push('Supabase')
    }

    if (markedToDelete.length === 2) {
      return 'Marcado para excluir do GitHub e Supabase'
    }

    if (markedToDelete.length === 1) {
      return `Marcado para excluir do ${markedToDelete[0]}`
    }

    if (item.hasGithubRecord && item.isPublishedInSupabase) {
      return 'Público no GitHub e Supabase'
    }

    if (item.hasGithubRecord) {
      return 'Público no GitHub'
    }

    if (item.isPublishedInSupabase) {
      return 'Público no Supabase'
    }
  }

  const markedToPublish = []

  if (selection?.publishGithub) {
    markedToPublish.push('GitHub')
  }

  if (selection?.publishSupabase) {
    markedToPublish.push('Supabase')
  }

  if (markedToPublish.length === 2) {
    return 'Marcado para subir no GitHub e Supabase'
  }

  if (markedToPublish.length === 1) {
    return `Marcado para subir no ${markedToPublish[0]}`
  }

  return 'Fora do público'
}

function DestinationControls({ item, selection, disabled, onSelectionChange }) {
  if (item.isPublic) {
    return (
      <div className="admin-destination-controls" role="group" aria-label={`Destinos do item ${item.id}`}>
        {item.hasGithubRecord ? (
          <label className={`admin-destination-option ${selection.deleteGithub ? 'is-active is-danger' : ''}`}>
            <input
              type="checkbox"
              checked={selection.deleteGithub}
              disabled={disabled}
              onChange={(event) => onSelectionChange(item.id, 'deleteGithub', event.target.checked)}
            />
            <span>Excluir GitHub</span>
          </label>
        ) : null}
        {item.isPublishedInSupabase ? (
          <label className={`admin-destination-option ${selection.deleteSupabase ? 'is-active is-danger' : ''}`}>
            <input
              type="checkbox"
              checked={selection.deleteSupabase}
              disabled={disabled}
              onChange={(event) => onSelectionChange(item.id, 'deleteSupabase', event.target.checked)}
            />
            <span>Excluir Supabase</span>
          </label>
        ) : null}
      </div>
    )
  }

  return (
    <div className="admin-destination-controls" role="group" aria-label={`Destinos do item ${item.id}`}>
      <label className={`admin-destination-option ${selection.publishGithub ? 'is-active' : ''}`}>
        <input
          type="checkbox"
          checked={selection.publishGithub}
          disabled={disabled}
          onChange={(event) => onSelectionChange(item.id, 'publishGithub', event.target.checked)}
        />
        <span>Subir GitHub</span>
      </label>
      <label className={`admin-destination-option ${selection.publishSupabase ? 'is-active' : ''}`}>
        <input
          type="checkbox"
          checked={selection.publishSupabase}
          disabled={disabled}
          onChange={(event) => onSelectionChange(item.id, 'publishSupabase', event.target.checked)}
        />
        <span>Subir Supabase</span>
      </label>
    </div>
  )
}

function VisitorsPanel({ visitCount, visits, loading }) {
  const [open, setOpen] = useState(false)
  const orderedVisits = useMemo(
    () => [...visits].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [visits],
  )

  return (
    <section className="panel admin-block admin-insights">
      <button type="button" className="admin-insights__trigger" onClick={() => setOpen((current) => !current)}>
        <div>
          <span className="panel__label">Visitantes</span>
          <h3>Visitantes: {visitCount.toLocaleString('pt-BR')}</h3>
        </div>
        <span className="admin-insights__hint">{open ? 'Ocultar últimos 20' : 'Ver últimos 20'}</span>
      </button>

      {open ? (
        <div className="admin-insights__list">
          {loading && !orderedVisits.length ? (
            <p className="admin-empty">Carregando acessos recentes...</p>
          ) : orderedVisits.length ? (
            <ol>
              {orderedVisits.map((visit, index) => (
                <li key={visit.id}>
                  <strong>
                    {index + 1}º {formatApproxRegion(visit)}
                  </strong>
                  <span>{new Date(visit.createdAt).toLocaleString('pt-BR')}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="admin-empty">Nenhum acesso recente registrado.</p>
          )}
        </div>
      ) : null}
    </section>
  )
}

function ExtraPhotoManager({
  title,
  items,
  category,
  disabled,
  selections,
  onAdd,
  onUpdate,
  onSelectionChange,
}) {
  async function handleUpload(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) {
      return
    }

    await onAdd(category, files)
    event.target.value = ''
  }

  return (
    <section className="panel admin-block">
      <div className="admin-block__header">
        <div>
          <span className="panel__label">{title}</span>
          <h3>Novas fotos</h3>
        </div>
        <label className="button button--ghost button--small file-trigger">
          Subir fotos
          <input type="file" accept="image/*" multiple disabled={disabled} onChange={handleUpload} />
        </label>
      </div>

      <div className="admin-photo-list">
        {items.length ? (
          items.map((item) => (
            <article className="admin-photo-card" key={item.id}>
              <img src={item.src} alt={item.name || title} />
              <p className="panel__label">{getDestinationStatusLabel(item, selections[item.id])}</p>
              <DestinationControls
                item={item}
                selection={selections[item.id] || createEmptySelection()}
                disabled={disabled}
                onSelectionChange={onSelectionChange}
              />
              <textarea
                rows="3"
                placeholder="Texto ou descrição desta foto"
                value={item.description}
                disabled={disabled || !item.hasSupabaseRecord}
                onChange={(event) => onUpdate(category, item.id, event.target.value)}
              />
            </article>
          ))
        ) : (
          <p className="admin-empty">Nenhuma foto nova cadastrada.</p>
        )}
      </div>
    </section>
  )
}

function AdminPanel({
  draftContent,
  visitCount,
  recentVisits,
  recentVisitsLoading,
  reviews,
  reviewsLoading,
  reviewActionPending,
  extraPhotos,
  extraPhotosLoading,
  extraPhotoActionPending,
  onClose,
  onTextChange,
  onMediaReplace,
  onAddExtraPhotos,
  onUpdateExtraPhoto,
  supabaseMediaPending,
  supabaseMediaStatus,
  supabaseMediaMessage,
  onSupabaseMediaUpload,
  githubPublishPending,
  githubPublishStatus,
  githubPublishMessage,
  onGithubPublish,
}) {
  const [filter, setFilter] = useState('all')
  const [gallerySelections, setGallerySelections] = useState({})
  const [reviewSelections, setReviewSelections] = useState({})

  useEffect(() => {
    const allItems = [...extraPhotos.carpintaria, ...extraPhotos.alvenaria]

    setGallerySelections((current) => {
      const next = {}

      allItems.forEach((item) => {
        next[item.id] = createSelectionForItem(item, current[item.id])
      })

      return next
    })
  }, [extraPhotos])

  useEffect(() => {
    setReviewSelections((current) => {
      const next = {}

      reviews.forEach((review) => {
        next[review.id] = createSelectionForItem(review, current[review.id])
      })

      return next
    })
  }, [reviews])

  const filteredReviews = useMemo(() => {
    const ordered = [...reviews].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

    if (filter === 'all') {
      return ordered
    }

    if (filter === 'private') {
      return ordered.filter((review) => review.status === 'private')
    }

    if (filter === 'approved') {
      return ordered.filter((review) => review.status === 'approved')
    }

    if (filter === 'pending') {
      return ordered.filter((review) => review.status === 'pending')
    }

    return ordered.filter((review) => String(review.stars) === filter)
  }, [filter, reviews])

  async function handleMediaChange(event, key) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const dataUrl = await fileToDataUrl(file)
    onMediaReplace(key, dataUrl)
    event.target.value = ''
  }

  async function handleGithubPublishClick() {
    const allPhotos = [...extraPhotos.carpintaria, ...extraPhotos.alvenaria]
    const galleryIdsToPublish = allPhotos
      .filter((item) => !item.isPublic && gallerySelections[item.id]?.publishGithub)
      .map((item) => item.id)
    const galleryIdsToDelete = allPhotos
      .filter((item) => item.hasGithubRecord && gallerySelections[item.id]?.deleteGithub)
      .map((item) => item.id)
    const reviewIdsToPublish = reviews
      .filter((review) => !review.isPublic && reviewSelections[review.id]?.publishGithub)
      .map((review) => review.id)
    const reviewIdsToDelete = reviews
      .filter((review) => review.hasGithubRecord && reviewSelections[review.id]?.deleteGithub)
      .map((review) => review.id)

    await onGithubPublish({
      galleryIdsToPublish,
      reviewIdsToPublish,
      galleryIdsToDelete,
      reviewIdsToDelete,
    })
  }

  async function handleSupabaseMediaUploadClick() {
    const allPhotos = [...extraPhotos.carpintaria, ...extraPhotos.alvenaria]
    const galleryIdsToPublish = allPhotos
      .filter((item) => !item.isPublic && gallerySelections[item.id]?.publishSupabase)
      .map((item) => item.id)
    const galleryIdsToDelete = allPhotos
      .filter((item) => item.isPublishedInSupabase && gallerySelections[item.id]?.deleteSupabase)
      .map((item) => item.id)
    const reviewIdsToPublish = reviews
      .filter((review) => !review.isPublic && reviewSelections[review.id]?.publishSupabase)
      .map((review) => review.id)
    const reviewIdsToDelete = reviews
      .filter((review) => review.isPublishedInSupabase && reviewSelections[review.id]?.deleteSupabase)
      .map((review) => review.id)

    await onSupabaseMediaUpload({
      galleryIdsToPublish,
      reviewIdsToPublish,
      galleryIdsToDelete,
      reviewIdsToDelete,
    })
  }

  return (
    <aside className="admin-panel">
      <div className="admin-panel__backdrop" onClick={onClose} />
      <div className="admin-panel__content">
        <header className="admin-header">
          <div>
            <span className="panel__label">ADM</span>
            <h2>Painel administrativo</h2>
          </div>
          <button type="button" className="button button--ghost button--small" onClick={onClose}>
            Fechar
          </button>
        </header>

        <VisitorsPanel visitCount={visitCount} visits={recentVisits} loading={recentVisitsLoading} />

        <section className="panel admin-block">
          <span className="panel__label">Textos principais</span>
          <div className="admin-form-grid">
            {TEXT_FIELDS.map(([label, path]) => (
              <label className="admin-field" key={path}>
                <span>{label}</span>
                <textarea
                  rows={path === 'about.text' ? 6 : 3}
                  value={getByPath(draftContent, path)}
                  onChange={(event) => onTextChange(path, event.target.value)}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="panel admin-block">
          <span className="panel__label">Mídias editáveis</span>
          <div className="admin-media-grid">
            {[
              ['Foto de apresentação', 'presentationPhoto'],
              ['Fundo topo carpintaria', 'carpentryTop'],
              ['Fundo rodapé carpintaria', 'carpentryBottom'],
              ['Fundo topo alvenaria', 'masonryTop'],
              ['Fundo rodapé alvenaria', 'masonryBottom'],
              ['Vídeo principal', 'introVideo'],
            ].map(([label, key]) => (
              <label className="admin-field" key={key}>
                <span>{label}</span>
                <input
                  type="file"
                  accept={key === 'introVideo' ? 'video/*' : 'image/*'}
                  onChange={(event) => handleMediaChange(event, key)}
                />
              </label>
            ))}
          </div>
        </section>

        <ExtraPhotoManager
          title="Carpintaria"
          category="carpintaria"
          items={extraPhotos.carpintaria}
          disabled={extraPhotosLoading || extraPhotoActionPending}
          selections={gallerySelections}
          onAdd={onAddExtraPhotos}
          onUpdate={onUpdateExtraPhoto}
          onSelectionChange={(id, key, checked) =>
            setGallerySelections((current) => ({
              ...current,
              [id]: {
                ...createEmptySelection(),
                ...current[id],
                [key]: checked,
              },
            }))
          }
        />

        <ExtraPhotoManager
          title="Pedreiro / Alvenaria"
          category="alvenaria"
          items={extraPhotos.alvenaria}
          disabled={extraPhotosLoading || extraPhotoActionPending}
          selections={gallerySelections}
          onAdd={onAddExtraPhotos}
          onUpdate={onUpdateExtraPhoto}
          onSelectionChange={(id, key, checked) =>
            setGallerySelections((current) => ({
              ...current,
              [id]: {
                ...createEmptySelection(),
                ...current[id],
                [key]: checked,
              },
            }))
          }
        />

        <section className="panel admin-block">
          <div className="admin-block__header">
            <div>
              <span className="panel__label">Avaliações</span>
              <h3>Controle de publicação</h3>
            </div>
            <select
              value={filter}
              disabled={reviewsLoading || reviewActionPending}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Todas</option>
              <option value="approved">Aprovadas</option>
              <option value="pending">Pendentes</option>
              <option value="private">Privadas</option>
              <option value="5">5 estrelas</option>
              <option value="4">4 estrelas</option>
              <option value="3">3 estrelas</option>
              <option value="2">2 estrelas</option>
              <option value="1">1 estrela</option>
            </select>
          </div>

          <div className="admin-review-list">
            {reviewsLoading && !filteredReviews.length ? (
              <p className="admin-empty">Carregando avaliações do Supabase...</p>
            ) : filteredReviews.length ? (
              filteredReviews.map((review) => (
                <article className="admin-review-card" key={review.id}>
                  <div className="admin-review-card__top">
                    <strong>{'★'.repeat(review.stars)}</strong>
                    <span>{getDestinationStatusLabel(review, reviewSelections[review.id])}</span>
                    <span>{translateReviewStatus(review.status)}</span>
                    <span>{new Date(review.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <p>{review.comment}</p>
                  <p className="admin-review-card__region">Região: {formatApproxRegion(review)}</p>
                  <DestinationControls
                    item={review}
                    selection={reviewSelections[review.id] || createEmptySelection()}
                    disabled={reviewActionPending}
                    onSelectionChange={(id, key, checked) =>
                      setReviewSelections((current) => ({
                        ...current,
                        [id]: {
                          ...createEmptySelection(),
                          ...current[id],
                          [key]: checked,
                        },
                      }))
                    }
                  />
                </article>
              ))
            ) : (
              <p className="admin-empty">Nenhuma avaliação para este filtro.</p>
            )}
          </div>
        </section>

        <footer className="admin-footer">
          <div className="admin-footer__actions">
            <div className="admin-footer__publish">
              <button
                type="button"
                className="button button--ghost"
                disabled={supabaseMediaPending}
                onClick={handleSupabaseMediaUploadClick}
              >
                {supabaseMediaPending ? 'Publicando...' : 'Publicar no Supabase'}
              </button>
              {supabaseMediaMessage ? (
                <p className={`admin-footer__status is-${supabaseMediaStatus}`}>{supabaseMediaMessage}</p>
              ) : null}
            </div>

            <div className="admin-footer__publish">
              <button
                type="button"
                className="button button--primary"
                disabled={githubPublishPending}
                onClick={handleGithubPublishClick}
              >
                {githubPublishPending ? 'Publicando...' : 'Publicar no GitHub'}
              </button>
              <p className={`admin-footer__status is-${githubPublishStatus}`}>{githubPublishMessage}</p>
            </div>
          </div>
        </footer>
      </div>
    </aside>
  )
}

export { updateByPath }
export default AdminPanel
