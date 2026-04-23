const RATE_LIMIT_WINDOW_MS = 15_000
const requestBuckets = new Map()

function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  })
}

function normalizeOrigin(value) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return ''
  }

  try {
    return new URL(trimmed).origin
  } catch {
    return trimmed
  }
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowedOrigin = normalizeOrigin(env.ALLOWED_ORIGIN)

  if (!allowedOrigin || origin === allowedOrigin) {
    return {
      'Access-Control-Allow-Origin': allowedOrigin || origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  }

  return {
    'Access-Control-Allow-Origin': 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function assertAllowedOrigin(request, env) {
  const allowedOrigin = normalizeOrigin(env.ALLOWED_ORIGIN)
  const origin = request.headers.get('Origin') || ''

  if (allowedOrigin && origin !== allowedOrigin) {
    throw new Error('Origin não permitida.')
  }
}

function assertConfigured(env) {
  const githubToken =
    env.DISPATCH_KEY ||
    env.GH_DISPATCH_PAT ||
    env.DISPATCH_PAT ||
    env.WORKFLOW_DISPATCH_TOKEN ||
    env.GITHUB_WORKFLOW_TOKEN ||
    env.GITHUB_TOKEN
  const required = [
    'ADMIN_PUBLISH_KEY',
    'GITHUB_OWNER',
    'GITHUB_REPO',
    'GITHUB_WORKFLOW_FILE',
    'GITHUB_BRANCH',
  ]

  const missing = required.filter((key) => !env[key])
  if (!githubToken) {
    missing.push('DISPATCH_KEY')
  }
  if (missing.length) {
    throw new Error(`Worker incompleto: faltam secrets ${missing.join(', ')}`)
  }
}

function checkRateLimit(request) {
  const requester =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('Origin') ||
    'unknown'

  const now = Date.now()
  const previous = requestBuckets.get(requester) || 0

  if (now - previous < RATE_LIMIT_WINDOW_MS) {
    throw new Error('Aguarde alguns segundos antes de tentar publicar novamente.')
  }

  requestBuckets.set(requester, now)

  for (const [key, timestamp] of requestBuckets.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
      requestBuckets.delete(key)
    }
  }
}

async function dispatchGithubWorkflow(env) {
  const githubToken =
    env.DISPATCH_KEY ||
    env.GH_DISPATCH_PAT ||
    env.DISPATCH_PAT ||
    env.WORKFLOW_DISPATCH_TOKEN ||
    env.GITHUB_WORKFLOW_TOKEN ||
    env.GITHUB_TOKEN
  const response = await fetch(
    `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'anderson-carpintaria-reformas-worker',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: env.GITHUB_BRANCH,
      }),
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`GitHub recusou o disparo do workflow: ${response.status} ${details}`)
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    if (request.method !== 'POST') {
      return json(
        {
          ok: false,
          message: 'Método não permitido.',
          timestamp: new Date().toISOString(),
        },
        405,
        corsHeaders,
      )
    }

    try {
      assertConfigured(env)
      assertAllowedOrigin(request, env)
      checkRateLimit(request)

      const payload = await request.json().catch(() => ({}))
      if (payload?.adminCredential !== env.ADMIN_PUBLISH_KEY) {
        return json(
          {
            ok: false,
            message: 'Credencial administrativa inválida.',
            timestamp: new Date().toISOString(),
          },
          401,
          corsHeaders,
        )
      }

      await dispatchGithubWorkflow(env)

      return json(
        {
          ok: true,
          message: 'Workflow do GitHub acionado com sucesso.',
          timestamp: new Date().toISOString(),
          runStatus: 'queued',
        },
        200,
        corsHeaders,
      )
    } catch (error) {
      return json(
        {
          ok: false,
          message: error instanceof Error ? error.message : 'Falha ao acionar publicação.',
          timestamp: new Date().toISOString(),
        },
        500,
        corsHeaders,
      )
    }
  },
}
