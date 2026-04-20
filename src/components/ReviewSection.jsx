import { useMemo, useState } from 'react'

function ReviewSection({ intro, reviews, onCreateReview }) {
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [feedback, setFeedback] = useState('')

  const publicReviews = useMemo(
    () =>
      reviews
        .filter((review) => review.status === 'approved')
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [reviews],
  )

  function handleSubmit(event) {
    event.preventDefault()

    if (!stars) {
      setFeedback('Escolha primeiro de 1 a 5 estrelas.')
      return
    }

    if (!comment.trim()) {
      setFeedback('Escreva um comentário antes de enviar.')
      return
    }

    const nextStatus = stars <= 3 ? 'private' : 'pending'

    onCreateReview({
      stars,
      comment: comment.trim(),
      status: nextStatus,
    })

    setFeedback(
      nextStatus === 'private'
        ? 'Obrigado pelo retorno. Sua avaliação foi registrada.'
        : 'Obrigado pela avaliação. Seu comentário foi enviado para análise antes da publicação.',
    )
    setStars(0)
    setComment('')
  }

  return (
    <section className="section" id="avaliacoes">
      <div className="container review-layout">
        <div className="section-copy">
          <p className="section-copy__label">{intro.title}</p>
          <h2>Todo comentario, avaliacao e sugestao sao bem-vindos.</h2>
          <p>{intro.text}</p>
        </div>

        <div className="review-grid">
          <form className="review-form panel" onSubmit={handleSubmit}>
            <div className="form-block">
              <span className="panel__label">1. Escolha as estrelas</span>
              <div className="rating-stars" role="radiogroup" aria-label="Avaliação em estrelas">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value <= stars ? 'is-active' : ''}
                    aria-label={`${value} estrela${value > 1 ? 's' : ''}`}
                    onClick={() => setStars(value)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-block">
              <label className="panel__label" htmlFor="review-comment">
                2. Escreva o comentário
              </label>
              <textarea
                id="review-comment"
                rows="5"
                placeholder="Descreva sua experiência com o serviço."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </div>

            <button type="submit" className="button button--primary button--full">
              3. Enviar avaliação
            </button>

            {feedback ? <p className="form-feedback">{feedback}</p> : null}
          </form>

          <div className="review-public">
            {publicReviews.length ? (
              publicReviews.map((review) => (
                <article key={review.id} className="review-card panel">
                  <div className="review-card__stars" aria-label={`${review.stars} estrelas`}>
                    {'★'.repeat(review.stars)}
                  </div>
                  <p>{review.comment}</p>
                  <span>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
                </article>
              ))
            ) : (
              <article className="review-card panel review-card--empty">
                <p>As avaliações aprovadas aparecerão aqui após a análise manual no painel administrativo.</p>
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ReviewSection
