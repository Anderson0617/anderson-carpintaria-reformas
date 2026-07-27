import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { createServer } from 'vite'

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const distIndexPath = path.join(projectRoot, 'dist', 'index.html')
const base = '/anderson-carpintaria-reformas/'

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
  const appHtml = render()
  const documentHtml = await readFile(distIndexPath, 'utf8')
  const emptyRoot = '<div id="root"></div>'
  const rootOccurrences = documentHtml.split(emptyRoot).length - 1

  if (rootOccurrences !== 1) {
    throw new Error(`Esperado exatamente um root vazio no dist/index.html; encontrados: ${rootOccurrences}.`)
  }

  if (
    !appHtml.includes('<h1>Carpintaria e Reformas em São José e Grande Florianópolis</h1>') ||
    !appHtml.includes(`${base}anderson-apresentacao.jpeg`) ||
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

  await writeFile(distIndexPath, prerenderedDocument, 'utf8')
  console.log('Pré-renderização pública concluída em dist/index.html.')
} finally {
  await vite.close()
}
