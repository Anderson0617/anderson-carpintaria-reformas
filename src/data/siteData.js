import videoPortas from '../../assets/video/0525-otimizado.mp4'

import capaTopoCarpintaria from '../../assets/CAPA-TOPO-73.jpeg'
import capaRodapeCarpintaria from '../../assets/CAPA-RODAPE.jpeg'
import carrossel1_1 from '../../assets/CARROCEL-1.jpeg'
import carrossel1_2 from '../../assets/CARROCEL-2.jpeg'
import carrossel1_3 from '../../assets/CARROCEL-3.jpeg'
import carrossel1_4 from '../../assets/CARROCEL-4.jpeg'
import carrossel1_5 from '../../assets/CARROCEL-5.jpeg'
import carrossel2_1 from '../../assets/2CARROCEL-1.jpeg'
import carrossel2_2 from '../../assets/2CARROCEL-2.jpeg'
import carrossel2_3 from '../../assets/2CARROCEL-3.jpeg'
import carrossel2_4 from '../../assets/2CARROCEL-4.jpeg'
import carrossel2_5 from '../../assets/2CARROCEL-5.jpeg'
import deckPronto from '../../assets/DEK-PROMTO.jpeg'
import estruturaDeck from '../../assets/ESTRUTURA-TEK.jpeg'
import madeiramento1 from '../../assets/MADEIRAMENTO-A-VISTA.jpeg'
import telhado from '../../assets/TELHADO.jpeg'
import pisoVinilico from '../../assets/PISO-VINILICO-CLIK.jpeg'
import madeiramento2 from '../../assets/2MADEIRAMENTO-A-VISTA.jpeg'

import fundoAlvenariaTopo from '../../assets/fundo-3.jpeg'
import fundoAlvenariaRodape from '../../assets/fundo-4-fim-rodape.jpeg'
import revestimento1 from '../../assets/revestimento-1.jpeg'
import revestimento2 from '../../assets/revestimento-2.jpeg'
import revestimento4 from '../../assets/revestimento4.jpeg'
import revestimento5 from '../../assets/revestimento-5.jpeg'
import revestimento6 from '../../assets/revestimento-6.jpeg'
import laje1 from '../../assets/laje-1.jpeg'
import laje2 from '../../assets/laje-2.jpeg'
import laje3 from '../../assets/laje-3.jpeg'
import laje4 from '../../assets/laje-4.jpeg'
import laje5 from '../../assets/laje-5.jpeg'
import piscina1 from '../../assets/pisina-1.jpeg'
import piscina2 from '../../assets/pisina-2.jpeg'
import piscina3 from '../../assets/pisina-3.jpeg'
import piscina4 from '../../assets/pisina-4.jpeg'
import alvenaria1 from '../../assets/avenaria-1.jpeg'
import alvenaria2 from '../../assets/alvenaria-2.jpeg'
import alvenaria3 from '../../assets/alvenaria-3.jpeg'
import alvenaria4 from '../../assets/alvenaria-4.jpeg'
import alvenaria5 from '../../assets/alvenaria-5.jpeg'

const apresentacao = `${import.meta.env.BASE_URL}anderson-apresentacao-otimizada.jpeg`

export const SITE_PASSWORD = '2805'

export const heroButtons = [
  { label: 'Falar no WhatsApp', href: 'https://wa.me/5548991691906?text=Olá%20Gostaria%20de%20Mais%20Informações%20Desde%20Já%20agradeço.', variant: 'secondary' },
]

export const serviceItems = [
  {
    title: 'Carpintaria',
    description: 'Serviços de madeira para estruturas, ajustes, montagens e acabamento em obras residenciais.',
  },
  {
    title: 'Estruturas em madeira',
    description: 'Execução e reforma de estruturas com atenção a apoio, alinhamento, encaixe e resistência.',
  },
  {
    title: 'Decks',
    description: 'Construção e reforma de decks de madeira, da base estrutural ao acabamento final.',
  },
  {
    title: 'Pergolados',
    description: 'Montagem de pergolados de madeira para áreas externas, com estrutura firme e acabamento limpo.',
  },
  {
    title: 'Telhados e coberturas',
    description: 'Construção e reforma de madeiramento, telhados e coberturas, incluindo estruturas aparentes.',
  },
  {
    title: 'Portas e aberturas',
    description: 'Instalação, ajuste e acabamento de portas e outras aberturas conforme a necessidade da obra.',
  },
  {
    title: 'Piso vinílico click',
    description: 'Instalação de piso vinílico click com preparação, alinhamento e acabamento.',
  },
  {
    title: 'Alvenaria',
    description: 'Execução e reparos em paredes, bases, concreto e outras etapas de construção.',
  },
  {
    title: 'Reformas',
    description: 'Reformas residenciais com organização das etapas, correções e acabamento.',
  },
  {
    title: 'Revestimentos',
    description: 'Assentamento de revestimentos cerâmicos com paginação, alinhamento e acabamento.',
  },
  {
    title: 'Lajes e vigamento',
    description: 'Execução de lajes, vigamento e preparação de passagens com atenção à estrutura.',
  },
  {
    title: 'Caixaria e radier',
    description: 'Montagem de formas, caixaria e radier com travamento e preparação adequada da base.',
  },
]

export const fixedGallerySections = {
  carpintaria: {
    id: 'carpintaria',
    eyebrow: 'Carpintaria',
    title: 'Madeira, estrutura e acabamento com leitura técnica de obra',
    intro:
      'Da estrutura ao detalhe final, cada frente é organizada para entregar resistência, alinhamento visual e acabamento limpo.',
    topDivider: capaTopoCarpintaria,
    bottomDivider: capaRodapeCarpintaria,
    carousels: [
      {
        id: 'carp-1',
        title: 'Estrutural e acabamento',
        description:
          'Execução firme com atenção ao encaixe, ao esquadro e ao acabamento que valoriza a peça pronta.',
        images: [
          { src: carrossel1_1, alt: 'Estrutural e acabamento em madeira — etapa 1' },
          { src: carrossel1_2, alt: 'Estrutural e acabamento em madeira — etapa 2' },
          { src: carrossel1_3, alt: 'Estrutural e acabamento em madeira — etapa 3' },
          { src: carrossel1_4, alt: 'Estrutural e acabamento em madeira — etapa 4' },
          { src: carrossel1_5, alt: 'Estrutural e acabamento em madeira — etapa 5' },
        ],
      },
      {
        id: 'carp-2',
        title: 'Linhas principais, cumeeira e telhados em 3 águas',
        description:
          'Montagens conduzidas com lógica estrutural para garantir apoio correto, alinhamento e leitura limpa da cobertura.',
        images: [
          { src: carrossel2_1, alt: 'Estrutura de telhado em três águas — etapa 1' },
          { src: carrossel2_2, alt: 'Estrutura de telhado em três águas — etapa 2' },
          { src: carrossel2_3, alt: 'Estrutura de telhado em três águas — etapa 3' },
          { src: carrossel2_4, alt: 'Estrutura de telhado em três águas — etapa 4' },
          { src: carrossel2_5, alt: 'Estrutura de telhado em três águas — etapa 5' },
        ],
      },
      {
        id: 'carp-3',
        title: 'Deck em estrutura e peça finalizada',
        description:
          'Da base ao resultado pronto, o trabalho prioriza resistência, paginação coerente e acabamento valorizado.',
        images: [
          { src: deckPronto, alt: 'Deck de madeira finalizado' },
          { src: estruturaDeck, alt: 'Estrutura de base para deck de madeira' },
        ],
      },
      {
        id: 'carp-4',
        title: 'Madeiramento à vista, piso click e cobertura',
        description:
          'Soluções de acabamento e cobertura integradas para entregar leitura estética forte e execução bem resolvida.',
        images: [
          { src: madeiramento1, alt: 'Madeiramento aparente em estrutura de madeira' },
          { src: telhado, alt: 'Estrutura de madeira e cobertura de telhado' },
          { src: pisoVinilico, alt: 'Instalação de piso vinílico click' },
          { src: madeiramento2, alt: 'Madeiramento aparente em estrutura de madeira' },
        ],
      },
    ],
  },
  alvenaria: {
    id: 'alvenaria',
    eyebrow: 'Alvenaria e Reformas',
    title: 'Alvenaria, concreto e revestimentos com execução limpa e controle de etapa',
    intro:
      'Frentes de reforma e construção conduzidas com organização, cuidado com base, estrutura e acabamento bem assentado.',
    topDivider: fundoAlvenariaTopo,
    bottomDivider: fundoAlvenariaRodape,
    carousels: [
      {
        id: 'alv-1',
        title: 'Revestimento cerâmico',
        description:
          'Assentamento com atenção ao alinhamento visual, paginação e acabamento para valorizar o ambiente pronto.',
        images: [
          { src: revestimento1, alt: 'Assentamento de revestimento cerâmico — etapa 1' },
          { src: revestimento2, alt: 'Assentamento de revestimento cerâmico — etapa 2' },
          { src: revestimento4, alt: 'Assentamento de revestimento cerâmico — etapa 4' },
          { src: revestimento5, alt: 'Assentamento de revestimento cerâmico — etapa 5' },
          { src: revestimento6, alt: 'Assentamento de revestimento cerâmico — etapa 6' },
        ],
      },
      {
        id: 'alv-2',
        title: 'Lajes, vigamento e tubulação',
        description:
          'Execução com leitura estrutural, preparo de base e organização das passagens para evitar retrabalho.',
        images: [
          { src: laje1, alt: 'Execução de laje e vigamento — etapa 1' },
          { src: laje2, alt: 'Execução de laje e vigamento — etapa 2' },
          { src: laje3, alt: 'Execução de laje e vigamento — etapa 3' },
          { src: laje4, alt: 'Execução de laje e vigamento — etapa 4' },
          { src: laje5, alt: 'Execução de laje e vigamento — etapa 5' },
        ],
      },
      {
        id: 'alv-3',
        title: 'Piscina, concreto armado e acabamento',
        description:
          'Etapas executadas com firmeza desde a estrutura até o acabamento, respeitando forma, volume e durabilidade.',
        images: [
          { src: piscina1, alt: 'Construção de piscina em concreto — etapa 1' },
          { src: piscina2, alt: 'Construção de piscina em concreto — etapa 2' },
          { src: piscina3, alt: 'Construção de piscina em concreto — etapa 3' },
          { src: piscina4, alt: 'Construção de piscina em concreto — etapa 4' },
        ],
      },
      {
        id: 'alv-4',
        title: 'Estrutura, caixaria e radier',
        description:
          'Serviços preparados com base correta, travamento e controle visual para sustentar uma obra confiável.',
        images: [
          { src: alvenaria1, alt: 'Estrutura, caixaria e radier — etapa 1' },
          { src: alvenaria2, alt: 'Estrutura, caixaria e radier — etapa 2' },
          { src: alvenaria3, alt: 'Estrutura, caixaria e radier — etapa 3' },
          { src: alvenaria4, alt: 'Estrutura, caixaria e radier — etapa 4' },
          { src: alvenaria5, alt: 'Estrutura, caixaria e radier — etapa 5' },
        ],
      },
    ],
  },
}

export const defaultPublishedContent = {
  hero: {
    title: 'Carpintaria e Reformas em São José e Grande Florianópolis',
    headline: 'Telhados, decks, pergolados, estruturas de madeira, alvenaria e reformas com acabamento e compromisso profissional.',
    support: '',
    whatsapp: '48991691906',
    email: 'anderson090485@gmail.com',
    region: 'São José e Grande Florianópolis',
  },
  introVideo: {
    media: videoPortas,
    quote: 'Construindo com qualidade, compromisso e serviço bem feito.',
    description:
      'Do estrutural ao acabamento, cada etapa é feita com cuidado, firmeza e respeito ao projeto.',
  },
  about: {
    text:
      'Sou natural de Florianópolis e me criei nas lavouras. Desde cedo comecei na construção civil, área em que adquiri experiência prática e visão de obra ao longo de muitos anos. Depois de uma fase difícil da vida, em que precisei parar e me reconstruir, estudei programação e ampliei minha forma de pensar e organizar projetos. Hoje, recuperado, volto com força para o trabalho que sei fazer, unindo experiência de campo, responsabilidade e capricho em cada serviço. Atuo com carpintaria, telhados, decks, pergolados, pisos, alvenaria e reformas, sempre buscando entregar um resultado firme, bonito e bem executado.',
  },
  reviewsIntro: {
    title: 'Avaliações',
    text: 'Cada comentário recebido ajuda a manter o padrão do atendimento e da execução.',
  },
  footer: {
    closing: 'Qualidade no fazer, compromisso no atendimento e respeito em cada obra.',
  },
  media: {
    presentationPhoto: apresentacao,
    carpentryTop: capaTopoCarpintaria,
    carpentryBottom: capaRodapeCarpintaria,
    masonryTop: fundoAlvenariaTopo,
    masonryBottom: fundoAlvenariaRodape,
  },
  extraPhotos: {
    carpintaria: [],
    alvenaria: [],
  },
}

export const defaultDraftContent = structuredClone(defaultPublishedContent)

export const defaultReviews = [
  {
    id: 'review-1',
    stars: 5,
    comment: 'Serviço muito bem executado, capricho no acabamento e atendimento correto do início ao fim.',
    status: 'approved',
    createdAt: '2026-04-10T14:30:00.000Z',
  },
  {
    id: 'review-2',
    stars: 4,
    comment: 'Pontualidade, organização e obra entregue com boa apresentação final.',
    status: 'approved',
    createdAt: '2026-04-12T09:15:00.000Z',
  },
  {
    id: 'review-3',
    stars: 2,
    comment: 'Comentário privado de baixa avaliação, visível apenas no painel administrativo.',
    status: 'private',
    createdAt: '2026-04-14T11:00:00.000Z',
  },
]

export const defaultPublishedReviews = defaultReviews.filter((review) => review.status === 'approved')
