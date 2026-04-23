import apresentacao from '../../assets/eu-apresentacao.jpeg'
import videoPortas from '../../assets/video/VIDEO-PORTAS.mp4'

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

export const SITE_PASSWORD = '2805'

export const heroButtons = [
  { label: 'Solicitar orçamento', href: '#contato', variant: 'primary' },
  { label: 'Falar no WhatsApp', href: 'https://wa.me/5548991691906', variant: 'secondary' },
]

export const serviceItems = [
  'Carpintaria',
  'Estruturas em madeira',
  'Decks',
  'Pergolados',
  'Telhados e coberturas',
  'Portas e aberturas',
  'Piso vinílico click',
  'Alvenaria',
  'Reformas',
  'Revestimentos',
  'Lajes e vigamento',
  'Caixaria e radier',
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
        images: [carrossel1_1, carrossel1_2, carrossel1_3, carrossel1_4, carrossel1_5],
      },
      {
        id: 'carp-2',
        title: 'Linhas principais, cumeeira e telhados em 3 águas',
        description:
          'Montagens conduzidas com lógica estrutural para garantir apoio correto, alinhamento e leitura limpa da cobertura.',
        images: [carrossel2_1, carrossel2_2, carrossel2_3, carrossel2_4, carrossel2_5],
      },
      {
        id: 'carp-3',
        title: 'Deck em estrutura e peça finalizada',
        description:
          'Da base ao resultado pronto, o trabalho prioriza resistência, paginação coerente e acabamento valorizado.',
        images: [deckPronto, estruturaDeck],
      },
      {
        id: 'carp-4',
        title: 'Madeiramento à vista, piso click e cobertura',
        description:
          'Soluções de acabamento e cobertura integradas para entregar leitura estética forte e execução bem resolvida.',
        images: [madeiramento1, telhado, pisoVinilico, madeiramento2],
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
        images: [revestimento1, revestimento2, revestimento4, revestimento5, revestimento6],
      },
      {
        id: 'alv-2',
        title: 'Lajes, vigamento e tubulação',
        description:
          'Execução com leitura estrutural, preparo de base e organização das passagens para evitar retrabalho.',
        images: [laje1, laje2, laje3, laje4, laje5],
      },
      {
        id: 'alv-3',
        title: 'Piscina, concreto armado e acabamento',
        description:
          'Etapas executadas com firmeza desde a estrutura até o acabamento, respeitando forma, volume e durabilidade.',
        images: [piscina1, piscina2, piscina3, piscina4],
      },
      {
        id: 'alv-4',
        title: 'Estrutura, caixaria e radier',
        description:
          'Serviços preparados com base correta, travamento e controle visual para sustentar uma obra confiável.',
        images: [alvenaria1, alvenaria2, alvenaria3, alvenaria4, alvenaria5],
      },
    ],
  },
}

export const defaultPublishedContent = {
  hero: {
    title: 'Anderson Carpintaria e Reformas',
    headline: 'Carpintaria e Reformas com Estrutura, Acabamento e Compromisso Profissional',
    support: '',
    whatsapp: '48 991691906',
    email: 'anderson090485@gmail.com',
    region: 'Florianópolis e regiões',
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
