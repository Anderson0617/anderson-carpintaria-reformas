const workerUrl = import.meta.env.VITE_PUBLISH_WORKER_URL?.trim()

export const isGithubPublishConfigured = Boolean(workerUrl)

export async function publishGithubWorkflow(adminCredential) {
  if (!workerUrl) {
    throw new Error('Endpoint do Worker não configurado. Preencha VITE_PUBLISH_WORKER_URL.')
  }

  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      adminCredential,
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || 'Falha ao publicar no GitHub.')
  }

  return payload
}
