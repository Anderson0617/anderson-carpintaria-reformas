import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { createServer } from 'vite'

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const distPath = path.join(projectRoot, 'dist')
const distIndexPath = path.join(projectRoot, 'dist', 'index.html')
const manifestPath = path.join(distPath, '.vite', 'manifest.json')
const base = '/anderson-carpintaria-reformas/'

function normalizeManifestPath(file) {
  return file.replaceAll('\\', '/').replace(/^\/+/, '')
}

function withBase(file) {
  return `${base}${normalizeManifestPath(file)}`
}

function mapManifestAssets(html, manifest) {
  const manifestOutputUrls = new Set()
  const replacements = new Map()

  Object.entries(manifest).forEach(([key, chunk]) => {
    if (!chunk?.file) {
      return
    }

    const outputUrl = withBase(chunk.file)

    ;[chunk.file, ...(chunk.css ?? []), ...(chunk.assets ?? [])].forEach((file) => {
      manifestOutputUrls.add(withBase(file))
    })

    ;[key, chunk.src].filter(Boolean).forEach((source) => {
      const sourceUrl = withBase(source)

      if (sourceUrl !== outputUrl) {
        replacements.set(sourceUrl, outputUrl)
      }
    })
  })

  let mappedHtml = html
  let replacementCount = 0

  ;[...replacements.entries()]
    .sort(([sourceA], [sourceB]) => sourceB.length - sourceA.length)
    .forEach(([sourceUrl, outputUrl]) => {
      const occurrences = mappedHtml.split(sourceUrl).length - 1

      if (!occurrences) {
        return
      }

      mappedHtml = mappedHtml.split(sourceUrl).join(outputUrl)
      replacementCount += occurrences
    })

  return {
    html: mappedHtml,
    manifestOutputUrls,
    replacementCount,
  }
}

function collectAssetUrls(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1])
}

const vite = await createServer({
  appType: 'custom',
  base,
  configFile: false,
  logLevel: 'warn',
  optimizeDeps: {
    noDiscovery: true,
  },
  plugins: [react()],
  root: projectRoot,
  server: {
    hmr: false,
    middlewareMode: true,
  },
})

try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx')
  const sourceAppHtml = render()
  const documentHtml = await readFile(distIndexPath, 'utf8')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const {
    html: appHtml,
    manifestOutputUrls,
    replacementCount,
  } = mapManifestAssets(sourceAppHtml, manifest)
  const emptyRoot = '<div id="root"></div>'
  const rootOccurrences = documentHtml.split(emptyRoot).length - 1

  if (rootOccurrences !== 1) {
    throw new Error(`Esperado exatamente um root vazio no dist/index.html; encontrados: ${rootOccurrences}.`)
  }

  if (
    !appHtml.includes('<h1>Carpintaria e Reformas em São José e Grande Florianópolis</h1>') ||
    !appHtml.includes(`${base}anderson-apresentacao-otimizada.jpeg`) ||
    !appHtml.includes('alt="Anderson em apresentação profissional"')
  ) {
    throw new Error('O HTML pré-renderizado não contém o H1 e a foto pública esperados.')
  }

  if (appHtml.includes('class="admin-panel')) {
    throw new Error('O painel ADM não pode estar aberto no HTML pré-renderizado.')
  }

  const prerenderedDocument = documentHtml.replace(
    emptyRoot,
    `<div id="root">${appHtml}</div>`,
  )
  const localAssetUrls = [
    ...new Set(
      collectAssetUrls(prerenderedDocument).filter((url) =>
        url.startsWith(`${base}assets/`),
      ),
    ),
  ]
  const unresolvedAssetUrls = localAssetUrls.filter(
    (url) => !manifestOutputUrls.has(url),
  )

  if (unresolvedAssetUrls.length) {
    throw new Error(
      `Recursos locais sem correspondência no manifesto do Vite: ${unresolvedAssetUrls.join(', ')}`,
    )
  }

  await Promise.all(
    localAssetUrls.map((url) =>
      access(path.join(distPath, normalizeManifestPath(url.slice(base.length)))),
    ),
  )

  await writeFile(distIndexPath, prerenderedDocument, 'utf8')
  console.log(
    `Pré-renderização pública concluída em dist/index.html; ${replacementCount} referências de recursos mapeadas pelo manifesto do Vite.`,
  )
} finally {
  await vite.close()
}
