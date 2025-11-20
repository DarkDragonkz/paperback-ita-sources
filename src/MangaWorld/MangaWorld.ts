import {
  Source,
  Manga,
  Chapter,
  ChapterDetails,
  HomeSection,
  SearchRequest,
  PagedResults,
  SourceInfo,
  ContentRating,
  Request,
  Response,
} from 'paperback-extensions-common'

import * as cheerio from 'cheerio'

const MW_DOMAIN = 'https://www.mangaworld.mx'

export const MangaWorldInfo: SourceInfo = {
  version: '1.0.0',
  name: 'MangaWorld',
  icon: 'icon.png',
  author: 'DarkDragonkz',
  authorWebsite: 'https://github.com/DarkDragonkz',
  description: 'Estensione per MangaWorld (ITA)',
  contentRating: ContentRating.MATURE,
  websiteBaseURL: MW_DOMAIN,
  sourceTags: [
    {
      text: 'Italiano',
      type: 'grey'
    }
  ]
}

export class MangaWorld extends Source {
  baseUrl: string = MW_DOMAIN

  // --- 1. DETTAGLI MANGA ---
  async getMangaDetails(mangaId: string): Promise<Manga> {
    const request = createRequestObject({
      url: `${this.baseUrl}/manga/${mangaId}/`,
      method: 'GET',
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = cheerio.load(response.data)

    // Titolo
    const title = $('div.post-title h1').first().text().trim().replace(/[\t\n]/g, '')
    
    // Immagine Copertina
    const image = $('div.summary_image img').attr('src') ?? 
                  $('div.summary_image img').attr('data-src') ?? ''

    // Descrizione
    const desc = $('div.summary__content').text().trim()

    // Stato (MangaWorld usa termini italiani, proviamo a indovinare)
    let status = 1 // Default Ongoing
    const statusText = $('div.post-status div.summary-content').text().trim().toLowerCase()
    if (statusText.includes('completato') || statusText.includes('terminato')) {
      status = 0 // Completed
    }

    return createManga({
      id: mangaId,
      titles: [title],
      image: image,
      rating: 0,
      status: status,
      desc: desc,
      hentai: false // Cambia se necessario
    })
  }

  // --- 2. LISTA CAPITOLI ---
  async getChapters(mangaId: string): Promise<Chapter[]> {
    const request = createRequestObject({
      url: `${this.baseUrl}/manga/${mangaId}/`,
      method: 'GET',
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = cheerio.load(response.data)

    const chapters: Chapter[] = []

    // Selettore tipico di MangaWorld (Madara theme)
    $('li.wp-manga-chapter').each((_, element) => {
      const linkElement = $(element).find('a')
      const url = linkElement.attr('href') ?? ''
      
      // L'ID del capitolo è l'ultima parte dell'URL prima dello slash finale
      // Es: .../manga/naruto/capitolo-1/ -> "capitolo-1"
      // Attenzione: MangaWorld a volte usa ID lunghi. Prendiamo l'URL relativo completo dopo /manga/ID/
      let chapterId = ''
      if(url.includes(mangaId)) {
          chapterId = url.split(mangaId + '/')[1]
          if(chapterId.endsWith('/')) chapterId = chapterId.slice(0, -1)
      }

      const name = linkElement.text().trim()
      
      // Tenta di estrarre il numero del capitolo dal testo (es. "Capitolo 50")
      const chapNumRegex = name.match(/(\d+(\.\d+)?)/)
      const chapNum = chapNumRegex ? Number(chapNumRegex[0]) : 0

      const timeStr = $(element).find('span.chapter-release-date').text().trim()
      const time = new Date() // Per ora mettiamo data attuale per semplicità

      if (chapterId) {
        chapters.push(createChapter({
          id: chapterId,
          mangaId: mangaId,
          name: name,
          langCode: 'it',
          chapNum: chapNum,
          time: time
        }))
      }
    })

    return chapters
  }

  // --- 3. IMMAGINI DEL CAPITOLO ---
  async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
    const request = createRequestObject({
      url: `${this.baseUrl}/manga/${mangaId}/${chapterId}/`,
      method: 'GET',
    })

    const response = await this.requestManager.schedule(request, 1)
    const $ = cheerio.load(response.data)

    const pages: string[] = []

    // Selettore per le immagini di lettura
    $('.reading-content img').each((_, element) => {
      // MangaWorld usa spesso lazy loading, quindi cerchiamo data-src prima di src
      let img = $(element).attr('data-src') ?? $(element).attr('src')
      if (img) {
        // Pulisci URL se necessario (spesso hanno spazi o caratteri extra)
        img = img.trim()
        pages.push(img)
      }
    })

    return createChapterDetails({
      id: chapterId,
      mangaId: mangaId,
      pages: pages,
      longStrip: false
    })
  }

  // --- 4. RICERCA (Obbligatoria per far compilare, per ora base) ---
  async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
    // Implementazione futura
    return createPagedResults({
        results: []
    })
  }
  
  // --- 5. HOME PAGE (Obbligatoria) ---
  async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
      // Implementazione futura
      console.log("Home page requested")
  }
}