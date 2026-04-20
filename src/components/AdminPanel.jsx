import { useMemo, useState } from 'react'
import { fileToDataUrl } from '../lib/storage'

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

function ReviewActions({ review, onStatusChange, onDelete }) {
  return (
    <div className="admin-review-actions">
      <button type="button" onClick={() => onStatusChange(review.id, 'approved')}>
        Mandar para público
      </button>
      <button type="button" onClick={() => onStatusChange(review.id, 'pending')}>
        Deixar pendente
      </button>
      <button type="button" onClick={() => onStatusChange(review.id, 'hidden')}>
        Ocultar
      </button>
      <button type="button" onClick={() => onStatusChange(review.id, 'private')}>
        Privado
      </button>
      <button type="button" className="is-danger" onClick={() => onDelete(review.id)}>
        Excluir
      </button>
    </div>
  )
}

function ExtraPhotoManager({ title, items, category, onAdd, onUpdate, onDelete }) {
  async function handleUpload(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) {
      return
    }

    const preparedFiles = await Promise.all(
      files.map(async (file) => ({
        id: crypto.randomUUID(),
        src: await fileToDataUrl(file),
        description: '',
        name: file.name,
      })),
    )

    onAdd(category, preparedFiles)
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
          <input type="file" accept="image/*" multiple onChange={handleUpload} />
        </label>
      </div>

      <div className="admin-photo-list">
        {items.length ? (
          items.map((item) => (
            <article className="admin-photo-card" key={item.id}>
              <img src={item.src} alt={item.name || title} />
              <textarea
                rows="3"
                placeholder="Texto ou descrição desta foto"
                value={item.description}
                onChange={(event) => onUpdate(category, item.id, event.target.value)}
              />
              <button type="button" className="is-danger" onClick={() => onDelete(category, item.id)}>
                Excluir foto
              </button>
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
  reviews,
  onClose,
  onTextChange,
  onMediaReplace,
  onPublish,
  onReviewStatusChange,
  onReviewDelete,
  onAddExtraPhotos,
  onUpdateExtraPhoto,
  onDeleteExtraPhoto,
}) {
  const [filter, setFilter] = useState('all')

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
          items={draftContent.extraPhotos.carpintaria}
          onAdd={onAddExtraPhotos}
          onUpdate={onUpdateExtraPhoto}
          onDelete={onDeleteExtraPhoto}
        />

        <ExtraPhotoManager
          title="Pedreiro / Alvenaria"
          category="alvenaria"
          items={draftContent.extraPhotos.alvenaria}
          onAdd={onAddExtraPhotos}
          onUpdate={onUpdateExtraPhoto}
          onDelete={onDeleteExtraPhoto}
        />

        <section className="panel admin-block">
          <div className="admin-block__header">
            <div>
              <span className="panel__label">Avaliações</span>
              <h3>Controle de publicação e privado</h3>
            </div>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
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
            {filteredReviews.length ? (
              filteredReviews.map((review) => (
                <article className="admin-review-card" key={review.id}>
                  <div className="admin-review-card__top">
                    <strong>{'★'.repeat(review.stars)}</strong>
                    <span>{review.status}</span>
                    <span>{new Date(review.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <p>{review.comment}</p>
                  <ReviewActions
                    review={review}
                    onStatusChange={onReviewStatusChange}
                    onDelete={onReviewDelete}
                  />
                </article>
              ))
            ) : (
              <p className="admin-empty">Nenhuma avaliação para este filtro.</p>
            )}
          </div>
        </section>

        <footer className="admin-footer">
          <button type="button" className="button button--primary" onClick={onPublish}>
            Publicar alterações
          </button>
        </footer>
      </div>
    </aside>
  )
}

export { updateByPath }
export default AdminPanel
