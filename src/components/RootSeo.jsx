import { useEffect } from "react"
import { SEO_DEFAULT, getPublicBaseUrl } from "../config/seo"

function setMetaByProperty(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("property", property)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function setMetaByName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("name", name)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

/** 앱 마운트 시 문서 메타를 기본 SEO와 동기화(크롤러는 첫 HTML이 우선이나, SNS/브라우저 탭과 일치시킴) */
export default function RootSeo() {
  useEffect(() => {
    const base = getPublicBaseUrl()
    const canonical = base.endsWith("/") ? base : `${base}/`

    document.title = SEO_DEFAULT.title
    setMetaByName("description", SEO_DEFAULT.description)
    setMetaByName("keywords", SEO_DEFAULT.keywords)
    setMetaByName("robots", "index, follow")

    setMetaByProperty("og:type", "website")
    setMetaByProperty("og:locale", "ko_KR")
    setMetaByProperty("og:site_name", SEO_DEFAULT.siteName)
    setMetaByProperty("og:title", SEO_DEFAULT.title)
    setMetaByProperty("og:description", SEO_DEFAULT.description)
    setMetaByProperty("og:url", canonical)
    // og:image / twitter:image 미주입: 검색·링크 미리보기에 사이트 대표 이미지(아이콘) 노출 안 함

    setMetaByName("twitter:card", "summary")
    setMetaByName("twitter:title", SEO_DEFAULT.title)
    setMetaByName("twitter:description", SEO_DEFAULT.description)

    const linkCanonical = document.querySelector('link[rel="canonical"]')
    if (linkCanonical) linkCanonical.setAttribute("href", canonical)
  }, [])

  return null
}
