import * as cheerio from "cheerio"
import numbro from "numbro"
import { attempt, type error, fmtError } from "./utils.ts"

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
  {
    name: "astro-integration-4",
    description: "Description 4",
    link: "https://example.com",
    downloadsText: "1",
    downloads: 1,
    isOfficial: false,
  },
]

function parseDownloads(downloadsText: string): [number, error] {
  const [downloads, error] = attempt(() => numbro.unformat(downloadsText.toLowerCase()))
  if (error) return [-1, fmtError(`failed to unformat ${downloadsText}`, error)]
  if (typeof downloads !== "number") return [-1, fmtError(`not a number after unformatting ${downloadsText}`)]
  return [downloads, undefined]
}

async function getIntegrations(): Promise<[Integration[], error]> {
  if (import.meta.env.DEV) return [devData, undefined]

  const baseUrl = "https://astro.build/integrations"

  const pages: string[] = []
  for (let page = 1; ; page++) {
    const url = `${baseUrl}/${page > 1 ? `${page.toString()}/` : ""}`

    const [response, error] = await attempt(() => fetch(url, { redirect: "manual" }))
    if (error) return [[], fmtError(`failed to fetch ${url}`, error)]
    if (response.status === 302) break
    if (!response.ok) return [[], fmtError(`got ${response.status.toString()} from ${url}`)]

    const html = await response.text()
    pages.push(html)
  }

  const integrations: Integration[] = []
  for (const html of pages) {
    const [pageIntegrations, error] = processPage(html)
    if (error) return [[], fmtError("failed to process page", error)]
    integrations.push(...pageIntegrations)
  }

  integrations.sort((a, b) => b.downloads - a.downloads)
  return [integrations, undefined]
}

function processPage(html: string): [Integration[], error] {
  const $ = cheerio.load(html)

  const integrations: Integration[] = []
  const panels = $("article.panel").toArray()
  for (const panel of panels) {
    const article = $(panel)
    const integration = article.find("a")
    const link = integration.attr("href") ?? ""

    const header = integration.find("h3")
    const name = header.contents().first().text().trim()
    const isOfficial = header.find("span").text().trim() === "Official"

    const description = integration.find("p").text().trim()

    const downloadsText = integration.find("div > span").first().text().trim()
    const [downloads, error] = parseDownloads(downloadsText)
    if (error) return [[], fmtError(`failed to parse downloads for ${name}`, error)]

    integrations.push({ name, description, link, downloadsText, downloads, isOfficial })
  }

  return [integrations, undefined]
}

export { getIntegrations }
