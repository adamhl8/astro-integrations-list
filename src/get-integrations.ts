import * as cheerio from "cheerio"

interface Integration {
  name: string
  description: string
  link: string
  downloadsText: string
  downloads: number
}

function parseDownloads(downloadsText: string): number {
  let multiplier = 1
  if (downloadsText.endsWith("K")) multiplier = 1_000
  else if (downloadsText.endsWith("M")) multiplier = 1_000_000
  const downloads = downloadsText.slice(0, -1)
  return Number.parseFloat(downloads) * multiplier
}

async function getIntegrations() {
  const integrations: Integration[] = []
  const baseUrl = "https://astro.build/integrations"

  for (let page = 1; ; page++) {
    const url = `${baseUrl}/${page > 1 ? `${page.toString()}/` : ""}`
    try {
      const response = await fetch(url, { redirect: "manual" })
      if (response.status === 302) break

      const html = await response.text()
      const $ = cheerio.load(html)

      $("article.panel").each((_, element) => {
        const article = $(element)
        const integration = article.find("a")
        const link = integration.attr("href") ?? ""
        const name = integration.find("h3").text().trim()
        const description = integration.find("p").text().trim()
        const downloadsText = integration.find("div > span").first().text().trim()
        const downloads = parseDownloads(downloadsText)

        integrations.push({ name, description, link, downloadsText, downloads })
      })
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      break
    }
  }

  integrations.sort((a, b) => b.downloads - a.downloads)
  return integrations
}

export { getIntegrations }
