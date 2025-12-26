// lib/lang.ts
// Pequeno utilitário de i18n (PT/EN) para o Destinote.
// Mantém a abordagem simples: a UI lê o idioma via URL (?lang=pt|en)
// e salva preferências no localStorage.

export type Lang = 'pt' | 'en';

export const LANG_KEY = 'destinote_lang';

export function normalizeLang(v: unknown): Lang {
  if (typeof v !== 'string') return 'pt';

  const s = v.toLowerCase().trim();

  // aceita en, en-us, en_us...
  if (s === 'en' || s.startsWith('en-') || s.startsWith('en_')) return 'en';

  // aceita pt, pt-br, pt_br...
  if (s === 'pt' || s.startsWith('pt-') || s.startsWith('pt_')) return 'pt';

  return 'pt';
}


export function isLang(v: unknown): v is Lang {
  return v === 'pt' || v === 'en';
}

export function getLangFromSearchParams(sp: URLSearchParams | null | undefined): Lang | null {
  if (!sp) return null;
  const raw = sp.get('lang');
  return raw === 'en' || raw === 'pt' ? raw : null;
}

export function setLangInUrl(
  pathname: string,
  searchParams: URLSearchParams,
  lang: Lang
): string {
  const next = new URLSearchParams(searchParams.toString());
  next.set('lang', lang);
  const q = next.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function addLangToHref(href: string, lang: Lang): string {
  // preserva hash
  const [beforeHash, hash] = href.split('#');
  const [path, query] = beforeHash.split('?');

  const params = new URLSearchParams(query ?? '');
  params.set('lang', lang);
  const q = params.toString();

  const rebuilt = q ? `${path}?${q}` : path;
  return hash ? `${rebuilt}#${hash}` : rebuilt;
}

// Dicionário mínimo de UI. Não tenta ser um i18n “enterprise”, só o suficiente
// para a Sprint de internacionalização.
export const UI = {
  pt: {
    language: 'Idioma',
    languageShort: 'PT',
    categories: 'Categorias',
    filters: 'Filtros',
    createMyList: 'Criar minha lista',
    myList: 'Minha Lista',
    addToList: 'Adicionar à lista',
    close: 'Fechar',
    about: 'Sobre',
    signIn: 'Entrar',
    profile: 'Perfil',
    game: 'Jogo',
    heroTagline: 'Destinote',
    heroSubtitle: 'Seu site de listas de objetivos, tarefas e metas para todas as ocasiões',
    exploreList: 'Explorar a lista',
    scrollToDiscover: 'role para descobrir mais',
    loadingGoals: 'Carregando os objetivos...',
    topListTitle: 'Top 10',
    topListSubtitle: (n: number) => `As ${n} coisas mais selecionadas da lista`,
    allGoalsTitle: 'A lista',
    waitingExperiences: (n: number) => `De experiências simples a desafios épicos: ideias do que fazer pelo menos uma vez!`,
    showingOf: (a: number, b: number) => ``,
    loadingMore: 'Carregando mais objetivos...',
    seenAll: (n: number) => `✨ Você viu todos os ${n} objetivos! ✨`,
    footerLine1: '© 2025 Destinote - 1000 coisas para fazer na vida',
    footerLine2: 'Criado com ❤️ para inspirar aventuras e experiências memoráveis',
    showAll: 'Mostrar todos',
    loadingGroups: 'Carregando grupos...',
    loadingCategories: 'Carregando categorias...',
    selectOne: 'Selecionar uma',
    selectMany: 'Selecionar várias',
    selected: 'Selecionado',
    clickToToggle: 'Clique para alternar',
    clickToChoose: 'Clique para escolher',
    noneSelected: 'Nenhuma categoria selecionada',
    chooseFilterToEnableViewList: 'Escolha um filtro para liberar “Ver a lista”.',
    selectedCountLabel: 'Selecionados:',
    groupLabelShort: 'Grupo:',
    active: 'Ativo',
    filterVerb: 'Filtrar',
    categoriesSectionTitle: 'Categorias',
    filteredByGroup: '(filtradas pelo Grupo)',
    showingPlain: (a: number, b: number) => `Mostrando ${a} de ${b}`,
    languagePageTitle: 'Preferência de idioma',
    languagePageSubtitle:
      'Essa preferência fica salva no seu navegador e controla textos e dados (PT/EN).',
    portuguese: 'Português',
    english: 'English',
    goalModalKicker: (id: number) => `Objetivo #${id}`,
    activeFilters: 'Filtros ativos',
    clearFilters: 'Limpar filtros',
    removeFilter: 'Remover filtro',
    aboutTitle: 'Sobre o Destinote',
    aboutP1:
      'Destinote nasceu da ideia de transformar a vida em um grande jogo de missões: pequenas metas do dia a dia, desafios épicos, viagens, experiências estranhas, momentos românticos e marcos pessoais.',
    aboutP2:
      'A lista começou como um projeto pessoal e virou um mapa de possibilidades: 1000 coisas para fazer na vida, e muitas outras a caminho. Essa é só a Fase 1 do projeto – em breve, listas personalizadas, modos colaborativos e novas formas de explorar o mundo.',
    aboutP3:
      'Versão alpha • Em constante evolução • Feito com uma mistura de código, coragem e um leve vício em checklists.',
    creatorAlt: 'Foto de Fellipe, criador do Destinote',
    creatorBio:
      'Criador da lista, professor de inglês, engenheiro químico de formação, músico, voluntário e mochileiro das galáxias.',
    filtersCenterTitle: 'Central de filtros',
    filtersCenterSubtitle:
      'Selecione um Grupo (opcional) e uma ou mais categorias para gerar uma lista filtrada na Home.',
    mode: 'Modo',
    single: 'Único',
    multiple: 'Vários',
    groups: 'Grupos',
    viewList: 'Ver a lista',
    loginTitle: 'Entrar no Destinote',
    loginSubtitle: 'Use um dos usuários de teste ou crie em breve sua própria conta.',
    email: 'Email',
    password: 'Senha',
    signingIn: 'Entrando...',
    signInBtn: 'Entrar',
    loginFail: 'Falha ao entrar. Verifique suas credenciais.',
    bigThemesTitle: 'Grandes temas',
    showAllMacros: 'Mostrar todos',
    filterByThemeHint: 'Filtrar por este tema',
    categoriesTitle: 'Categorias',
    loading: 'Carregando...',
    toggleModeTitle: 'Alternar modo de seleção',
    multiMode: 'Múltiplo',
    singleMode: 'Único',
    clearAll: 'Limpar tudo',
    selectedCats: 'Selecionadas',
    goalsCountLabel: (n: number) => `${n} objetivo${n === 1 ? '' : 's'}`,
    noCategoriesInTheme: 'Nenhuma categoria encontrada neste tema.',
    readyToViewHint: 'Selecione as categorias e depois clique para ver os objetivos.',

  },
  en: {
    language: 'Language',
    languageShort: 'EN',
    categories: 'Groups',
    filters: 'Filters',
    createMyList: 'Create my list',
    myList: 'My List',
    addToList: 'Add to list',
    close: 'Close',
    about: 'About',
    signIn: 'Sign in',
    profile: 'Profile',
    game: 'Game',
    heroTagline: 'DESTINOTE',
    heroSubtitle: 'Your site for goals, tasks, and bucket-list missions for every mood',
    exploreList: 'Explore the list',
    scrollToDiscover: 'scroll to discover more',
    loadingGoals: 'Loading goals...',
    topListTitle: 'Top things to do',
    topListSubtitle: (n: number) => `The ${n} most iconic goals`,
    allGoalsTitle: 'The list',
    waitingExperiences: (n: number) => `From simple goals to legendary challenges: ideas of what to do at least once!`,
    showingOf: (a: number, b: number) => ``,
    loadingMore: 'Loading more goals...',
    seenAll: (n: number) => `✨ You’ve seen all ${n} goals! ✨`,
    footerLine1: '© 2025 Destinote - 1,000 things to do in life',
    footerLine2: 'Made with ❤️ to inspire adventures and memorable experiences',
    showAll: 'Show all',
    loadingGroups: 'Loading groups...',
    loadingCategories: 'Loading categories...',
    selectOne: 'Select one',
    selectMany: 'Select many',
    selected: 'Selected',
    clickToToggle: 'Click to toggle',
    clickToChoose: 'Click to choose',
    noneSelected: 'No category selected',
    chooseFilterToEnableViewList: 'Pick a filter to enable “View list”.',
    selectedCountLabel: 'Selected:',
    groupLabelShort: 'Group:',
    active: 'Active',
    filterVerb: 'Filter',
    categoriesSectionTitle: 'Categories',
    filteredByGroup: '(filtered by Group)',
    showingPlain: (a: number, b: number) => `Showing ${a} of ${b}`,
    languagePageTitle: 'Language preference',
    languagePageSubtitle:
      'This preference is saved in your browser and controls both UI and data (PT/EN).',
    portuguese: 'Português',
    english: 'English',
    goalModalKicker: (id: number) => `Goal #${id}`,
    activeFilters: 'Active filters',
    clearFilters: 'Clear filters',
    removeFilter: 'Remove filter',
    aboutTitle: 'About Destinote',
    aboutP1:
      'Destinote was born from the idea of turning life into a giant quest game: tiny day-to-day missions, epic challenges, trips, weird experiences, romantic moments, and personal milestones.',
    aboutP2:
      'The list started as a personal project and became a map of possibilities: 1,000 things to do in life — and many more on the way. This is only Phase 1: soon you’ll have personalized lists, collaborative modes, and new ways to explore the world.',
    aboutP3:
      'Alpha version • Always evolving • Built with code, courage, and a checklist addiction.',
    creatorAlt: 'Photo of Fellipe, creator of Destinote',
    creatorBio:
      'List creator, English teacher, chemical engineer by training, musician, volunteer, and a galaxy-hopping backpacker.',
    filtersCenterTitle: 'Filters hub',
    filtersCenterSubtitle:
      'Pick a Group (optional) and one or more categories to generate a filtered list on the Home page.',
    mode: 'Mode',
    single: 'Single',
    multiple: 'Multi',
    groups: 'Groups',
    viewList: 'View list',
    loginTitle: 'Sign in to Destinote',
    loginSubtitle: 'Use one of the test users, or create your own account soon.',
    email: 'Email',
    password: 'Password',
    signingIn: 'Signing in...',
    signInBtn: 'Sign in',
    loginFail: 'Sign-in failed. Check your credentials.',
    bigThemesTitle: 'Big themes',
    showAllMacros: 'Show all',
    filterByThemeHint: 'Filter by this theme',
    categoriesTitle: 'Categories',
    loading: 'Loading...',
    toggleModeTitle: 'Toggle selection mode',
    multiMode: 'Multiple',
    singleMode: 'Single',
    clearAll: 'Clear all',
    selectedCats: 'Selected',
    goalsCountLabel: (n: number) => `${n} goal${n === 1 ? '' : 's'}`,
    noCategoriesInTheme: 'No categories found in this theme.',
    readyToViewHint: 'Select categories and then click to view goals.',
  },
} as const;

export function ui<K extends keyof typeof UI.pt>(lang: unknown, key: K): (typeof UI.pt)[K] {
  const l = normalizeLang(lang);
  const dict = (UI as any)[l] ?? UI.pt;

  const val = dict[key];
  if (val !== undefined) return val;

  const fallback = (UI.pt as any)[key];
  if (fallback !== undefined) return fallback;

  // Se chegar aqui, é key realmente faltando no dicionário.
  console.warn(`[i18n] Missing UI key "${String(key)}" for lang "${l}"`);
  return UI.pt.language as any; // fallback ultra seguro (string), evita crash geral
}

