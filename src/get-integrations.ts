import * as cheerio from "cheerio"

interface Integration {
  name: string
  description: string
  link: string
  downloadsText: string
  downloads: number
  isOfficial: boolean
}

const devData: Integration[] = [
  {
    name: "astro-integration-1",
    description: "Description 1",
    link: "https://example.com",
    downloadsText: "2M",
    downloads: 2_000_000,
    isOfficial: true,
  },
  {
    name: "astro-integration-2",
    description: "Description 2",
    link: "https://example.com",
    downloadsText: "200K",
    downloads: 200_000,
    isOfficial: false,
  },
  {
    name: "astro-integration-3",
    description: "Description 3",
    link: "https://example.com",
    downloadsText: "200",
    downloads: 200,
    isOfficial: false,
  },
]

function parseDownloads(downloadsText: string): number {
  let multiplier = 1
  if (downloadsText.endsWith("K")) multiplier = 1_000
  else if (downloadsText.endsWith("M")) multiplier = 1_000_000
  const downloads = downloadsText.slice(0, -1)
  return Number.parseFloat(downloads) * multiplier
}

async function getIntegrations() {
  if (import.meta.env.DEV) return devData

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

        const header = integration.find("h3")
        const name = header.contents().first().text().trim()
        const isOfficial = header.find("span").text().trim() === "Official"

        const description = integration.find("p").text().trim()
        const downloadsText = integration.find("div > span").first().text().trim()
        const downloads = parseDownloads(downloadsText)

        integrations.push({ name, description, link, downloadsText, downloads, isOfficial })
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
