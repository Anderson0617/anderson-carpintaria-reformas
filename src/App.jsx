import { useEffect, useRef, useState } from 'react'
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
import {
  createReview as createSupabaseReview,
  deleteReview as deleteSupabaseReview,
  listGithubPublicReviews,
  listAdminReviews,
  mergePublicReviewLists,
  listPublicReviews,
  updateReviewStatus as updateSupabaseReviewStatus,
} from './lib/reviews'
import {
  deleteGalleryEntry as deleteSupabaseGalleryEntry,
  groupGalleryEntries,
  listGithubGalleryEntries,
  listAdminGalleryEntries,
  listPublicGalleryEntries,
  mergePublicGalleryEntries,
  publishGalleryEntriesByIds as publishSupabaseGalleryEntriesByIds,
  updateGalleryEntryDescription,
  uploadGalleryEntry,
} from './lib/gallery'
import { loadState, saveState } from './lib/storage'
import { isSupabaseConfigured } from './lib/supabase'
import { listRecentVisits, getSiteVisits, incrementSiteVisits } from './lib/visitors'
import { getApproxLocation, getOrCreateVisitorSessionId } from './lib/location'
import { isGithubPublishConfigured, publishGithubWorkflow } from './lib/githubPublish'
import { EDITABLE_MEDIA_PATHS, isDataUrl, listPublicEditableMedia, uploadEditableMediaAssets } from './lib/mediaAssets'
import {
  deleteGalleryDraftFile,
  getGalleryDraftPublishPayload,
  saveGalleryDraftFile,
} from './lib/galleryDraftStore'

const initialState = {
  draftContent: defaultDraftContent,
  publishedContent: defaultPublishedContent,
}

const VISIT_SESSION_KEY = 'anderson-carpintaria-visit-registered'

function applyEditableMediaOverrides(content, overrides) {
  let nextContent = structuredClone(content)

  for (const [key, url] of Object.entries(overrides)) {
    const path = EDITABLE_MEDIA_PATHS[key]
    if (!path || !url) {
      continue
    }

    nextContent = updateByPath(nextContent, path, url)
  }

  return nextContent
}

function mergeEditableMediaIntoState(state, overrides) {
  const nextPublished = applyEditableMediaOverrides(state.publishedContent, overrides)
  let nextDraft = structuredClone(state.draftContent)

  for (const [key, url] of Object.entries(overrides)) {
    const path = EDITABLE_MEDIA_PATHS[key]
    if (!path || !url) {
      continue
    }

    const currentDraftValue = path.split('.').reduce((accumulator, segment) => accumulator?.[segment], nextDraft)
    if (!isDataUrl(currentDraftValue)) {
      nextDraft = updateByPath(nextDraft, path, url)
    }
  }

  return {
    ...state,
    draftContent: nextDraft,
    publishedContent: nextPublished,
  }
}

function collectPendingEditableMedia(content) {
  return Object.fromEntries(
    Object.entries(EDITABLE_MEDIA_PATHS)
      .map(([key, path]) => [key, path.split('.').reduce((accumulator, segment) => accumulator?.[segment], content)])
      .filter(([, value]) => isDataUrl(value)),
  )
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
  const [reviews, setReviews] = useState(() =>
    isSupabaseConfigured || !import.meta.env.DEV ? [] : defaultReviews,
  )
  const [publicReviews, setPublicReviews] = useState(() =>
    isSupabaseConfigured || !import.meta.env.DEV
      ? []
      : defaultReviews.filter((review) => review.status === 'approved'),
  )
  const [githubPublicReviews, setGithubPublicReviews] = useState(() => [])
  const [adminOpen, setAdminOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [adminCredential, setAdminCredential] = useState('')
  const [publishMessage, setPublishMessage] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminReviewsLoading, setAdminReviewsLoading] = useState(false)
  const [reviewMutationPending, setReviewMutationPending] = useState(false)
  const [galleryEntries, setGalleryEntries] = useState(() => [])
  const [publicGalleryEntries, setPublicGalleryEntries] = useState(() => [])
  const [githubGalleryEntries, setGithubGalleryEntries] = useState(() => [])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryMutationPending, setGalleryMutationPending] = useState(false)
  const [visitCount, setVisitCount] = useState(0)
  const [visitCountReady, setVisitCountReady] = useState(false)
  const [recentVisits, setRecentVisits] = useState([])
  const [recentVisitsLoading, setRecentVisitsLoading] = useState(false)
  const [visitorLocation, setVisitorLocation] = useState(null)
  const [githubPublishPending, setGithubPublishPending] = useState(false)
  const [githubPublishStatus, setGithubPublishStatus] = useState('idle')
  const [githubPublishMessage, setGithubPublishMessage] = useState('Aguardando')
  const [optimisticGithubGalleryIds, setOptimisticGithubGalleryIds] = useState([])
  const [optimisticGithubReviewIds, setOptimisticGithubReviewIds] = useState([])
  const [supabaseMediaPending, setSupabaseMediaPending] = useState(false)
  const [supabaseMediaStatus, setSupabaseMediaStatus] = useState('idle')
  const [supabaseMediaMessage, setSupabaseMediaMessage] = useState('')
  const mobileMenuRef = useRef(null)
  const serviceGridRef = useRef(null)
  const publishTimeoutRef = useRef(null)

  useEffect(() => {
    saveState(siteState)
  }, [siteState])

  useEffect(() => () => window.clearTimeout(publishTimeoutRef.current), [])

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

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    refreshPublicReviews({ silent: true })
  }, [])

  useEffect(() => {
    refreshGithubPublicReviews({ silent: true })
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    refreshPublicGalleryEntries({ silent: true })
  }, [])

  useEffect(() => {
    refreshGithubGalleryEntries({ silent: true })
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    refreshPublicEditableMedia({ silent: true })
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || typeof window === 'undefined') {
      return
    }

    let cancelled = false

    async function syncVisitCount({ increment = false } = {}) {
      try {
        const location = visitorLocation ?? (await getApproxLocation())
        if (!cancelled) {
          setVisitorLocation(location)
        }

        const nextCount = increment
          ? await incrementSiteVisits({
              location,
              sessionId: getOrCreateVisitorSessionId(),
            })
          : await getSiteVisits()

        if (!cancelled) {
          setVisitCount(nextCount)
          setVisitCountReady(true)
        }
      } catch (error) {
        console.error('Erro ao carregar contador global de visitas', error)
      }
    }

    const hasRegisteredVisit = window.sessionStorage.getItem(VISIT_SESSION_KEY) === '1'

    if (hasRegisteredVisit) {
      syncVisitCount()
    } else {
      window.sessionStorage.setItem(VISIT_SESSION_KEY, '1')
      syncVisitCount({ increment: true })
    }

    const refreshInterval = window.setInterval(() => {
      syncVisitCount()
    }, 15000)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        syncVisitCount()
      }
    }

    function handleWindowFocus() {
      syncVisitCount()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      cancelled = true
      window.clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [visitorLocation])

  function showToast(message) {
    setPublishMessage(message)
    window.clearTimeout(publishTimeoutRef.current)
    publishTimeoutRef.current = window.setTimeout(() => setPublishMessage(''), 2600)
  }

  function getReviewErrorMessage(error, fallbackMessage) {
    if (error instanceof Error && error.message.includes('Supabase não configurado')) {
      return error.message
    }

    return fallbackMessage
  }

  function getWhatsappLink(phone) {
    const digits = phone.replace(/\D/g, '')
    const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
    return `https://wa.me/${withCountryCode}`
  }

  async function refreshPublicReviews({ silent = false } = {}) {
    try {
      const nextReviews = await listPublicReviews()
      setPublicReviews(nextReviews)
      return nextReviews
    } catch (error) {
      console.error('Erro ao carregar avaliações públicas', error)
      if (!silent) {
        showToast(getReviewErrorMessage(error, 'Não foi possível carregar as avaliações públicas.'))
      }
      return null
    }
  }

  async function refreshAdminReviews({ silent = false } = {}) {
    setAdminReviewsLoading(true)

    try {
      const nextReviews = await listAdminReviews(SITE_PASSWORD)
      setReviews(nextReviews)
      return nextReviews
    } catch (error) {
      console.error('Erro ao carregar avaliações do painel', error)
      if (!silent) {
        showToast(getReviewErrorMessage(error, 'Não foi possível carregar as avaliações do ADM.'))
      }
      return null
    } finally {
      setAdminReviewsLoading(false)
    }
  }

  async function refreshGithubPublicReviews({ silent = false } = {}) {
    try {
      const nextReviews = await listGithubPublicReviews()
      setGithubPublicReviews(nextReviews)
      setOptimisticGithubReviewIds((current) =>
        current.filter((id) => !nextReviews.some((review) => review.id === id)),
      )
      return nextReviews
    } catch (error) {
      console.error('Erro ao carregar avaliações publicadas no GitHub', error)
      if (!silent) {
        showToast(getReviewErrorMessage(error, 'Não foi possível carregar as avaliações publicadas no GitHub.'))
      }
      return null
    }
  }

  async function refreshPublicEditableMedia({ silent = false } = {}) {
    try {
      const overrides = await listPublicEditableMedia()
      setSiteState((current) => mergeEditableMediaIntoState(current, overrides))
      return overrides
    } catch (error) {
      console.error('Erro ao carregar mídias globais editadas', error)
      if (!silent) {
        showToast(getReviewErrorMessage(error, 'Não foi possível carregar as mídias globais.'))
      }
      return null
    }
  }

  async function refreshRecentVisits({ silent = false } = {}) {
    setRecentVisitsLoading(true)

    try {
      const nextVisits = await listRecentVisits(SITE_PASSWORD)
      setRecentVisits(nextVisits)
      return nextVisits
    } catch (error) {
      console.error('Erro ao carregar visitantes recentes', error)
      if (!silent) {
        showToast(getReviewErrorMessage(error, 'Não foi possível carregar os visitantes recentes.'))
      }
      return null
    } finally {
      setRecentVisitsLoading(false)
    }
  }

  async function refreshPublicGalleryEntries({ silent = false } = {}) {
    try {
      const nextEntries = await listPublicGalleryEntries()
      setPublicGalleryEntries(nextEntries)
      return nextEntries
    } catch (error) {
      console.error('Erro ao carregar fotos públicas', error)
      if (!silent) {
        showToast(getReviewErrorMessage(error, 'Não foi possível carregar as fotos publicadas.'))
      }
      return null
    }
  }

  async function refreshAdminGalleryEntries({ silent = false } = {}) {
    setGalleryLoading(true)

    try {
      const nextEntries = await listAdminGalleryEntries(SITE_PASSWORD)
      setGalleryEntries(nextEntries)
      return nextEntries
    } catch (error) {
      console.error('Erro ao carregar fotos do painel', error)
      if (!silent) {
        showToast(getReviewErrorMessage(error, 'Não foi possível carregar as fotos do ADM.'))
      }
      return null
    } finally {
      setGalleryLoading(false)
    }
  }

  async function refreshGithubGalleryEntries({ silent = false } = {}) {
    try {
      const nextEntries = await listGithubGalleryEntries()
      setGithubGalleryEntries(nextEntries)
      setOptimisticGithubGalleryIds((current) =>
        current.filter((id) => !nextEntries.some((entry) => entry.id === id)),
      )
      return nextEntries
    } catch (error) {
      console.error('Erro ao carregar fotos publicadas no GitHub', error)
      if (!silent) {
        showToast(getReviewErrorMessage(error, 'Não foi possível carregar as fotos publicadas no GitHub.'))
      }
      return null
    }
  }

  async function handleCreateReview(review) {
    try {
      const location = visitorLocation ?? (isSupabaseConfigured ? await getApproxLocation() : null)

      if (location) {
        setVisitorLocation(location)
      }

      await createSupabaseReview({
        ...review,
        ...location,
      })

      if (adminOpen) {
        await refreshAdminReviews({ silent: true })
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação', error)
      throw error
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()

    if (passwordValue === SITE_PASSWORD) {
      setAdminCredential(passwordValue)
      setAdminOpen(true)
      setPasswordModalOpen(false)
      setPasswordValue('')
      setPasswordError('')
      await Promise.all([refreshAdminReviews(), refreshAdminGalleryEntries(), refreshRecentVisits()])
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

  async function publishSelectedGalleryEntries(entryIds) {
    try {
      if (isSupabaseConfigured && entryIds.length) {
        setGalleryMutationPending(true)
        await publishSupabaseGalleryEntriesByIds(SITE_PASSWORD, entryIds)
        await Promise.all([
          refreshAdminGalleryEntries({ silent: true }),
          refreshPublicGalleryEntries({ silent: true }),
        ])
      }
    } catch (error) {
      console.error('Erro ao publicar fotos da galeria', error)
      throw error
    } finally {
      setGalleryMutationPending(false)
    }
  }

  async function handleReviewStatusChange(id, status) {
    setReviewMutationPending(true)

    try {
      await updateSupabaseReviewStatus(id, status, SITE_PASSWORD)
      await Promise.all([refreshAdminReviews({ silent: true }), refreshPublicReviews({ silent: true })])
    } catch (error) {
      console.error('Erro ao atualizar avaliação', error)
      showToast(getReviewErrorMessage(error, 'Não foi possível atualizar a avaliação.'))
    } finally {
      setReviewMutationPending(false)
    }
  }

  async function handleReviewDelete(id) {
    setReviewMutationPending(true)

    try {
      await deleteSupabaseReview(id, SITE_PASSWORD)
      setOptimisticGithubReviewIds((current) => current.filter((reviewId) => reviewId !== id))
      await Promise.all([refreshAdminReviews({ silent: true }), refreshPublicReviews({ silent: true })])
    } catch (error) {
      console.error('Erro ao excluir avaliação', error)
      showToast(getReviewErrorMessage(error, 'Não foi possível excluir a avaliação.'))
    } finally {
      setReviewMutationPending(false)
    }
  }

  async function handleGithubPublish(selectedGalleryEntryIds, selectedReviewIds) {
    if (githubPublishPending) {
      return
    }

    if (!isGithubPublishConfigured) {
      setGithubPublishStatus('error')
      setGithubPublishMessage('Endpoint do Worker não configurado.')
      return
    }

    if (!adminCredential) {
      setGithubPublishStatus('error')
      setGithubPublishMessage('Faça login no ADM novamente antes de publicar.')
      return
    }

    const githubPublishedIds = new Set([
      ...githubGalleryEntries.map((entry) => entry.id),
      ...optimisticGithubGalleryIds,
    ])
    const selectedGalleryEntries = galleryEntries.filter(
      (entry) => selectedGalleryEntryIds.includes(entry.id) && !githubPublishedIds.has(entry.id),
    )
    const githubPublishedReviewIds = new Set([
      ...githubPublicReviews.map((review) => review.id),
      ...optimisticGithubReviewIds,
    ])
    const selectedReviewEntries = reviews.filter(
      (review) => selectedReviewIds.includes(review.id) && !githubPublishedReviewIds.has(review.id),
    )

    if (!selectedGalleryEntries.length && !selectedReviewEntries.length) {
      setGithubPublishStatus('error')
      setGithubPublishMessage('Nenhum item marcado como "Subir" para publicar no GitHub.')
      return
    }

    setGithubPublishPending(true)
    setGithubPublishStatus('pending')
    setGithubPublishMessage('Publicando...')

    try {
      const galleryItems = []
      const reviewItems = selectedReviewEntries.map((review) => ({
        id: review.id,
        stars: review.stars,
        comment: review.comment,
        createdAt: review.createdAt,
        country: review.country ?? null,
        countryCode: review.countryCode ?? null,
        region: review.region ?? null,
        regionCode: review.regionCode ?? null,
        city: review.city ?? null,
        neighborhood: review.neighborhood ?? null,
        precision: review.precision ?? 'unknown',
      }))

      for (const entry of selectedGalleryEntries) {
        const payload = await getGalleryDraftPublishPayload(entry.id)
        if (!payload?.base64) {
          throw new Error('Esta foto precisa ser reenviada neste navegador para publicar pelo GitHub.')
        }

        galleryItems.push({
          id: entry.id,
          category: entry.category,
          name: entry.name,
          description: entry.description,
          fileName: payload.fileName,
          mimeType: payload.mimeType,
          base64: payload.base64,
        })
      }

      const result = await publishGithubWorkflow(adminCredential, {
        galleryItems,
        reviewItems,
      })
      setOptimisticGithubGalleryIds((current) => [...new Set([...current, ...galleryItems.map((item) => item.id)])])
      setOptimisticGithubReviewIds((current) => [...new Set([...current, ...reviewItems.map((item) => item.id)])])
      setGithubPublishStatus('success')
      setGithubPublishMessage('Publicado no GitHub')
      if (
        (Array.isArray(result?.publishedGalleryIds) && result.publishedGalleryIds.length) ||
        (Array.isArray(result?.publishedReviewIds) && result.publishedReviewIds.length)
      ) {
        await Promise.all([
          refreshGithubGalleryEntries({ silent: true }),
          refreshGithubPublicReviews({ silent: true }),
        ])
      }
    } catch (error) {
      console.error('Erro ao publicar no GitHub', error)
      setGithubPublishStatus('error')
      setGithubPublishMessage(
        error instanceof Error && error.message ? error.message : 'Falha ao publicar',
      )
    } finally {
      setGithubPublishPending(false)
    }
  }

  async function savePendingSupabaseChanges(selectedGalleryEntryIds = [], selectedReviewIds = []) {
    if (!isSupabaseConfigured) {
      setSupabaseMediaStatus('error')
      setSupabaseMediaMessage('Supabase não configurado.')
      throw new Error('Supabase não configurado.')
    }

    if (!adminCredential) {
      setSupabaseMediaStatus('error')
      setSupabaseMediaMessage('Faça login no ADM novamente antes de enviar.')
      throw new Error('Faça login no ADM novamente antes de enviar.')
    }

    const pendingAssets = collectPendingEditableMedia(siteState.draftContent)
    const selectedDraftGalleryEntryIds = galleryEntries
      .filter((entry) => entry.status === 'draft' && selectedGalleryEntryIds.includes(entry.id))
      .map((entry) => entry.id)
    const selectedPendingReviewIds = reviews
      .filter((review) => review.status !== 'approved' && selectedReviewIds.includes(review.id))
      .map((review) => review.id)

    if (!Object.keys(pendingAssets).length && !selectedDraftGalleryEntryIds.length && !selectedPendingReviewIds.length) {
      setSupabaseMediaStatus('idle')
      setSupabaseMediaMessage('Nenhuma alteração marcada para publicar no Supabase.')
      return {
        savedEditableMedia: false,
        publishedGalleryDrafts: false,
        publishedReviews: false,
      }
    }

    let savedEditableMedia = false
    let publishedGalleryDrafts = false
    let publishedReviews = false

    const uploadedUrls = await uploadEditableMediaAssets({
      assets: pendingAssets,
      adminPassword: adminCredential,
    }).catch((error) => {
      if (Object.keys(pendingAssets).length) {
        throw error
      }
      return {}
    })

    if (Object.keys(uploadedUrls).length) {
      setSiteState((current) => ({
        ...mergeEditableMediaIntoState(current, uploadedUrls),
        draftContent: applyEditableMediaOverrides(current.draftContent, uploadedUrls),
      }))
      await refreshPublicEditableMedia({ silent: true })
      savedEditableMedia = true
    }

    if (selectedDraftGalleryEntryIds.length) {
      await publishSelectedGalleryEntries(selectedDraftGalleryEntryIds)
      publishedGalleryDrafts = true
    }

    if (selectedPendingReviewIds.length) {
      setReviewMutationPending(true)

      try {
        await Promise.all(
          selectedPendingReviewIds.map((reviewId) =>
            updateSupabaseReviewStatus(reviewId, 'approved', SITE_PASSWORD),
          ),
        )
        await Promise.all([refreshAdminReviews({ silent: true }), refreshPublicReviews({ silent: true })])
        publishedReviews = true
      } finally {
        setReviewMutationPending(false)
      }
    }

    setSupabaseMediaStatus('success')
    if (savedEditableMedia && publishedGalleryDrafts && publishedReviews) {
      setSupabaseMediaMessage('Mídias, fotos e avaliações foram publicadas no Supabase.')
    } else if (savedEditableMedia && publishedGalleryDrafts) {
      setSupabaseMediaMessage('Mídias e fotos foram publicadas no Supabase.')
    } else if (savedEditableMedia && publishedReviews) {
      setSupabaseMediaMessage('Mídias e avaliações foram publicadas no Supabase.')
    } else if (publishedGalleryDrafts && publishedReviews) {
      setSupabaseMediaMessage('Fotos e avaliações marcadas como "Subir" foram publicadas.')
    } else if (savedEditableMedia) {
      setSupabaseMediaMessage('Mídias editáveis salvas no Supabase.')
    } else if (publishedGalleryDrafts) {
      setSupabaseMediaMessage('Fotos marcadas como "Subir" foram publicadas.')
    } else if (publishedReviews) {
      setSupabaseMediaMessage('Avaliações marcadas como "Subir" foram publicadas.')
    }

    return {
      savedEditableMedia,
      publishedGalleryDrafts,
      publishedReviews,
    }
  }

  async function handleSupabaseMediaUpload(selectedGalleryEntryIds, selectedReviewIds) {
    if (supabaseMediaPending) {
      return
    }

    setSupabaseMediaPending(true)
    setSupabaseMediaStatus('pending')
    setSupabaseMediaMessage('Salvando...')

    try {
      await savePendingSupabaseChanges(selectedGalleryEntryIds, selectedReviewIds)
    } catch (error) {
      console.error('Erro ao subir mídia para o Supabase', error)
      setSupabaseMediaStatus('error')
      setSupabaseMediaMessage(
        error instanceof Error && error.message ? error.message : 'Falha ao salvar no Supabase',
      )
    } finally {
      setSupabaseMediaPending(false)
    }
  }

  async function handleAddExtraPhotos(category, files) {
    if (!isSupabaseConfigured) {
      return
    }

    setGalleryMutationPending(true)

    try {
      const uploadedEntries = await Promise.all(
        files.map((file) =>
          uploadGalleryEntry({
            file,
            category,
            adminPassword: SITE_PASSWORD,
          }),
        ),
      )

      await Promise.all(
        uploadedEntries.map(async (entry, index) => {
          try {
            await saveGalleryDraftFile(entry.id, files[index])
          } catch (error) {
            console.error('Erro ao salvar rascunho local da foto', error)
            showToast('Foto enviada ao Supabase, mas não foi guardada neste navegador para publicar pelo GitHub.')
          }
        }),
      )

      await refreshAdminGalleryEntries({ silent: true })
    } catch (error) {
      console.error('Erro ao subir novas fotos', error)
      showToast(getReviewErrorMessage(error, 'Não foi possível subir as novas fotos.'))
    } finally {
      setGalleryMutationPending(false)
    }
  }

  async function handleUpdateExtraPhoto(_category, id, description) {
    if (!isSupabaseConfigured) {
      return
    }

    setGalleryEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, description } : entry)),
    )

    try {
      await updateGalleryEntryDescription(id, description, SITE_PASSWORD)
      await refreshPublicGalleryEntries({ silent: true })
    } catch (error) {
      console.error('Erro ao atualizar legenda da foto', error)
      showToast(getReviewErrorMessage(error, 'Não foi possível salvar o texto da foto.'))
      await refreshAdminGalleryEntries({ silent: true })
    }
  }

  async function handleDeleteExtraPhoto(_category, id) {
    if (!isSupabaseConfigured) {
      return
    }

    const entry = galleryEntries.find((item) => item.id === id)
    if (!entry) {
      return
    }

    setGalleryMutationPending(true)

    try {
      await deleteSupabaseGalleryEntry(entry, SITE_PASSWORD)
      await deleteGalleryDraftFile(id).catch(() => {})
      setOptimisticGithubGalleryIds((current) => current.filter((entryId) => entryId !== id))
      await Promise.all([
        refreshAdminGalleryEntries({ silent: true }),
        refreshPublicGalleryEntries({ silent: true }),
      ])
    } catch (error) {
      console.error('Erro ao excluir foto', error)
      showToast(getReviewErrorMessage(error, 'Não foi possível excluir a foto.'))
    } finally {
      setGalleryMutationPending(false)
    }
  }

  const content = siteState.publishedContent
  const mergedPublicReviews = mergePublicReviewLists(githubPublicReviews, publicReviews)
  const mergedPublicGalleryEntries = mergePublicGalleryEntries(githubGalleryEntries, publicGalleryEntries)
  const publicGalleryIds = new Set([
    ...mergedPublicGalleryEntries.map((entry) => entry.id),
    ...optimisticGithubGalleryIds,
  ])
  const publicReviewIds = new Set([
    ...mergedPublicReviews.map((review) => review.id),
    ...optimisticGithubReviewIds,
  ])
  const publicExtraPhotos = isSupabaseConfigured
    ? groupGalleryEntries(mergedPublicGalleryEntries)
    : githubGalleryEntries.length
      ? groupGalleryEntries(githubGalleryEntries)
      : content.extraPhotos
  const adminExtraPhotos = isSupabaseConfigured
    ? groupGalleryEntries(
        galleryEntries.map((entry) =>
          publicGalleryIds.has(entry.id)
            ? {
                ...entry,
                status: 'published',
              }
            : entry,
        ),
      )
    : siteState.draftContent.extraPhotos
  const adminReviews = reviews.map((review) =>
    publicReviewIds.has(review.id)
      ? {
          ...review,
          status: 'approved',
        }
      : review,
  )
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

              <ExtraGallery title="Novas fotos de carpintaria" photos={publicExtraPhotos.carpintaria} />

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

              <ExtraGallery title="Novas fotos de alvenaria e pedreiro" photos={publicExtraPhotos.alvenaria} />
            </div>
          </section>

          <ReviewSection
            intro={content.reviewsIntro}
            publicReviews={mergedPublicReviews}
            onCreateReview={handleCreateReview}
          />
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
            {isSupabaseConfigured ? (
              <p className="footer__count">Visitas: {visitCountReady ? visitCount.toLocaleString('pt-BR') : '...'}</p>
            ) : null}
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
              type="text"
              name="username"
              autoComplete="username"
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />
            <input
              type="password"
              name="current-password"
              inputMode="numeric"
              autoComplete="new-password"
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
          visitCount={visitCount}
          recentVisits={recentVisits}
          recentVisitsLoading={recentVisitsLoading}
          reviews={adminReviews}
          reviewsLoading={adminReviewsLoading}
          reviewActionPending={reviewMutationPending}
          extraPhotos={adminExtraPhotos}
          extraPhotosLoading={galleryLoading}
          extraPhotoActionPending={galleryMutationPending}
          onClose={() => {
            setAdminOpen(false)
            setAdminCredential('')
          }}
          onTextChange={handleTextChange}
          onMediaReplace={handleMediaReplace}
          onReviewDelete={handleReviewDelete}
          onAddExtraPhotos={handleAddExtraPhotos}
          onUpdateExtraPhoto={handleUpdateExtraPhoto}
          onDeleteExtraPhoto={handleDeleteExtraPhoto}
          supabaseMediaPending={supabaseMediaPending}
          supabaseMediaStatus={supabaseMediaStatus}
          supabaseMediaMessage={supabaseMediaMessage}
          onSupabaseMediaUpload={handleSupabaseMediaUpload}
          githubPublishPending={githubPublishPending}
          githubPublishStatus={githubPublishStatus}
          githubPublishMessage={githubPublishMessage}
          onGithubPublish={handleGithubPublish}
        />
      ) : null}

      {publishMessage ? <div className="publish-toast">{publishMessage}</div> : null}
    </>
  )
}

export default App
