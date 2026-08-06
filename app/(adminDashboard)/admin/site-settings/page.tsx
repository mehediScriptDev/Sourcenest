"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Save,
  Plus,
  X,
  GripVertical,
  ExternalLink,
  FileText,
  Share2,
  Info,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Instagram,
  Music2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Trash2,
  ChevronRight,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import {
  fetchAdminLegalPages,
  mapAdminLegalPageToUi,
  mapUiLegalPageToSave,
  updateAdminLegalPageContent,
} from "@/lib/api/admin-legal-pages"
import {
  fetchAdminAboutPage,
  mapAdminAboutPageToUi,
  mapUiAboutPageToSave,
  updateAdminAboutPage,
} from "@/lib/api/admin-about-page"
import {
  fetchAdminSocialMediaLinks,
  mapAdminSocialLinkToUi,
  mapUiSocialLinksToSync,
  syncAdminSocialMediaLinks,
} from "@/lib/api/admin-social-media-links"
import {
  defaultSocialLinks,
  defaultLegalPages,
  defaultAboutPage,
  type SocialMediaLink,
  type LegalPage,
  type AboutPageData
} from "@/lib/data/site-settings"

const getIconComponent = (iconName: string, iconOptions: { value: string; icon: typeof Linkedin }[]) => {
  const option = iconOptions.find(o => o.value === iconName)
  return option?.icon || Share2
}

export default function SiteSettingsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.siteSettings
  const c = t.admin.common
  const ic = t.admin.pages.industries
  const { toast } = useToast()

  const iconOptions = [
    { value: "Linkedin", label: p.iconLinkedIn, icon: Linkedin },
    { value: "Twitter", label: p.iconTwitter, icon: Twitter },
    { value: "Facebook", label: p.iconFacebook, icon: Facebook },
    { value: "Youtube", label: p.iconYouTube, icon: Youtube },
    { value: "Instagram", label: p.iconInstagram, icon: Instagram },
    { value: "Music2", label: p.iconTikTok, icon: Music2 },
  ]

  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>(defaultSocialLinks)
  const [socialLinksLoading, setSocialLinksLoading] = useState(true)
  const [socialLinksApiConnected, setSocialLinksApiConnected] = useState(false)
  const [legalPages, setLegalPages] = useState<LegalPage[]>(defaultLegalPages)
  const [legalPagesLoading, setLegalPagesLoading] = useState(true)
  const [aboutPage, setAboutPage] = useState<AboutPageData>(defaultAboutPage)
  const [aboutPageLoading, setAboutPageLoading] = useState(true)
  const [aboutPageApiConnected, setAboutPageApiConnected] = useState(false)
  const [selectedLegalPage, setSelectedLegalPage] = useState<string>("privacy")
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingSocial, setIsSavingSocial] = useState(false)

  useEffect(() => {
    const loadLegalPages = async () => {
      try {
        setLegalPagesLoading(true)
        const pages = await fetchAdminLegalPages()
        if (pages.length > 0) {
          setLegalPages(pages.map(mapAdminLegalPageToUi))
          setSelectedLegalPage(pages[0]?.slug || "privacy")
        }
      } catch (error) {
        toast({
          title: c.error,
          description: error instanceof Error ? error.message : p.legalPagesLoadFailed,
          variant: "destructive",
        })
      } finally {
        setLegalPagesLoading(false)
      }
    }

    void loadLegalPages()
  }, [])

  useEffect(() => {
    const loadAboutPage = async () => {
      try {
        setAboutPageLoading(true)
        const page = await fetchAdminAboutPage()
        if (page) {
          setAboutPage(mapAdminAboutPageToUi(page))
          setAboutPageApiConnected(true)
        } else {
          setAboutPageApiConnected(false)
        }
      } catch (error) {
        setAboutPageApiConnected(false)
        toast({
          title: c.error,
          description: error instanceof Error ? error.message : p.aboutPageLoadFailed,
          variant: "destructive",
        })
      } finally {
        setAboutPageLoading(false)
      }
    }

    void loadAboutPage()
  }, [])

  useEffect(() => {
    const loadSocialLinks = async () => {
      try {
        setSocialLinksLoading(true)
        const links = await fetchAdminSocialMediaLinks()
        if (links.length > 0) {
          setSocialLinks(links.map(mapAdminSocialLinkToUi))
          setSocialLinksApiConnected(true)
        } else {
          setSocialLinksApiConnected(false)
        }
      } catch (error) {
        setSocialLinksApiConnected(false)
        toast({
          title: c.error,
          description: error instanceof Error ? error.message : p.socialLinksLoadFailed,
          variant: "destructive",
        })
      } finally {
        setSocialLinksLoading(false)
      }
    }

    void loadSocialLinks()
  }, [])

  const saveLegalPagesToApi = async (pages: LegalPage[]) => {
    const pagesToSave = pages.filter((page) => page.apiId)

    if (pagesToSave.length === 0) {
      throw new Error(
        "Legal pages are not connected to the API yet. Refresh the page or run: php artisan db:seed --class=LegalPageSeeder"
      )
    }

    for (const page of pagesToSave) {
      const response = await updateAdminLegalPageContent(
        page.apiId!,
        mapUiLegalPageToSave(page)
      )

      if (response.data) {
        const updated = mapAdminLegalPageToUi(response.data)
        setLegalPages((prev) =>
          prev.map((item) => (item.slug === updated.slug ? updated : item))
        )
      }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveLegalPagesToApi(legalPages)

      await new Promise((resolve) => setTimeout(resolve, 300))

      toast({
        title: c.success,
        description: p.legalPagesSaved,
      })
    } catch (error) {
      toast({
        title: c.error,
        description: error instanceof Error ? error.message : p.legalPagesSaveFailed,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCurrentLegalPage = async () => {
    const current = legalPages.find((page) => page.id === selectedLegalPage)
    if (!current) return

    setIsSaving(true)
    try {
      await saveLegalPagesToApi([current])
      toast({
        title: c.success,
        description: p.legalPagesSaved,
      })
    } catch (error) {
      toast({
        title: c.error,
        description: error instanceof Error ? error.message : p.legalPagesSaveFailed,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAboutPage = async () => {
    if (!aboutPage.apiId) {
      toast({
        title: c.error,
        description: p.aboutPageNotConnected,
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await updateAdminAboutPage(mapUiAboutPageToSave(aboutPage))
      if (response.data) {
        setAboutPage(mapAdminAboutPageToUi(response.data))
      }

      toast({
        title: c.success,
        description: p.aboutPageSaved,
      })
    } catch (error) {
      toast({
        title: c.error,
        description: error instanceof Error ? error.message : p.aboutPageSaveFailed,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSocialLinks = async () => {
    const payload = mapUiSocialLinksToSync(socialLinks)

    if (payload.length === 0) {
      toast({
        title: c.error,
        description: p.socialLinksNotConnected,
        variant: "destructive",
      })
      return
    }

    const invalidEnabled = socialLinks.find(
      (link) => link.enabled && (!link.url.trim() || !/^https?:\/\//i.test(link.url.trim()))
    )
    if (invalidEnabled) {
      toast({
        title: c.error,
        description: `${invalidEnabled.platform}: enter a valid URL before enabling.`,
        variant: "destructive",
      })
      return
    }

    setIsSavingSocial(true)
    try {
      const synced = await syncAdminSocialMediaLinks(payload)
      setSocialLinks(synced.map(mapAdminSocialLinkToUi))
      setSocialLinksApiConnected(true)

      toast({
        title: c.success,
        description: p.socialLinksSaved,
      })
    } catch (error) {
      toast({
        title: c.error,
        description: error instanceof Error ? error.message : p.socialLinksSaveFailed,
        variant: "destructive",
      })
    } finally {
      setIsSavingSocial(false)
    }
  }

  // Social Links functions
  const toggleSocialLink = (id: string) => {
    setSocialLinks(links =>
      links.map(link =>
        link.id === id ? { ...link, enabled: !link.enabled } : link
      )
    )
  }

  const updateSocialUrl = (id: string, url: string) => {
    setSocialLinks(links =>
      links.map(link =>
        link.id === id ? { ...link, url } : link
      )
    )
  }

  const moveSocialLink = (id: string, direction: "up" | "down") => {
    const index = socialLinks.findIndex(l => l.id === id)
    if ((direction === "up" && index === 0) || (direction === "down" && index === socialLinks.length - 1)) {
      return
    }
    const newLinks = [...socialLinks]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    ;[newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]]
    newLinks.forEach((link, i) => { link.order = i + 1 })
    setSocialLinks(newLinks)
  }

  // Legal Pages functions
  const updateLegalSection = (pageId: string, sectionId: string, field: "title" | "content", value: string) => {
    setLegalPages(pages =>
      pages.map(page =>
        page.id === pageId
          ? {
              ...page,
              sections: page.sections.map(section =>
                section.id === sectionId ? { ...section, [field]: value } : section
              )
            }
          : page
      )
    )
  }

  const addLegalSection = (pageId: string) => {
    setLegalPages(pages =>
      pages.map(page =>
        page.id === pageId
          ? {
              ...page,
              sections: [
                ...page.sections,
                {
                  id: `section-${Date.now()}`,
                  sectionKey: `section-${Date.now()}`,
                  title: p.newSectionTitle.replace("{n}", String(page.sections.length + 1)),
                  content: c.sectionContentPlaceholder,
                  order: page.sections.length + 1
                }
              ]
            }
          : page
      )
    )
  }

  const deleteLegalSection = (pageId: string, sectionId: string) => {
    setLegalPages(pages =>
      pages.map(page =>
        page.id === pageId
          ? {
              ...page,
              sections: page.sections.filter(s => s.id !== sectionId)
            }
          : page
      )
    )
  }

  const toggleLegalPage = (pageId: string) => {
    setLegalPages(pages =>
      pages.map(page =>
        page.id === pageId ? { ...page, enabled: !page.enabled } : page
      )
    )
  }

  const updateLegalPageMeta = (pageId: string, field: "title" | "lastUpdated", value: string) => {
    setLegalPages(pages =>
      pages.map(page =>
        page.id === pageId ? { ...page, [field]: value } : page
      )
    )
  }


  const currentLegalPage = legalPages.find(p => p.id === selectedLegalPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{p.title}</h1>
          <p className="text-muted-foreground">
            {p.subtitle}
          </p>
          <p className="text-muted-foreground">{p.contentTranslationHint}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? c.saving : c.saveAllChanges}
        </Button>
      </div>

      <Tabs defaultValue="social" className="space-y-6">
        <TabsList className="flex flex-col sm:grid sm:grid-cols-3 h-auto gap-2 w-full">
          <TabsTrigger value="social" className="gap-2 w-full">
            <Share2 className="h-4 w-4" />
            {p.socialMedia}
          </TabsTrigger>
          <TabsTrigger value="legal" className="gap-2 w-full">
            <FileText className="h-4 w-4" />
            {p.legalPages}
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2 w-full">
            <Info className="h-4 w-4" />
            {p.aboutUs}
          </TabsTrigger>
        </TabsList>


        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    {c.socialMediaLinks}
                  </CardTitle>
                  <CardDescription>
                    {p.socialMediaDesc}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => void handleSaveSocialLinks()}
                  disabled={isSavingSocial || socialLinksLoading}
                  className="gap-2 shrink-0"
                >
                  <Save className="h-4 w-4" />
                  {isSavingSocial ? c.saving : c.saveChanges}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {socialLinksLoading ? (
                <div className="py-12 text-center text-muted-foreground">{c.loading}</div>
              ) : !socialLinksApiConnected && socialLinks.every((link) => !link.apiId) ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {p.socialLinksNotConnected}
                </div>
              ) : (
              <div className="space-y-3">
                {socialLinks.sort((a, b) => a.order - b.order).map((link) => {
                  const IconComponent = getIconComponent(link.icon, iconOptions)
                  return (
                    <div
                      key={link.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border p-4 transition-colors ${
                        link.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                        <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground cursor-grab" />
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{link.platform}</span>
                            {link.enabled ? (
                              <Badge variant="secondary" className="text-xs">{p.active}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">{p.hidden}</Badge>
                            )}
                          </div>
                          <Input
                            value={link.url}
                            onChange={(e) => updateSocialUrl(link.id, e.target.value)}
                            placeholder={c.urlPlaceholder}
                            disabled={!link.enabled}
                            className="mt-2 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end sm:justify-start gap-2 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => moveSocialLink(link.id, "up")}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => moveSocialLink(link.id, "down")}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Switch checked={link.enabled} onCheckedChange={() => toggleSocialLink(link.id)} />
                      </div>
                    </div>
                  )
                })}
              </div>
              )}

              <div className="rounded-lg bg-primary p-6">
                <p className="text-sm text-primary-foreground/60 mb-3">{p.footerPreview}</p>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.filter(l => l.enabled && l.url.trim()).sort((a, b) => a.order - b.order).map(link => {
                    const IconComponent = getIconComponent(link.icon, iconOptions)
                    return (
                      <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-primary-foreground">
                        <IconComponent className="h-5 w-5" />
                      </a>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Pages Tab */}
        <TabsContent value="legal" className="space-y-6">
          {legalPagesLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                {c.loading}
              </CardContent>
            </Card>
          ) : (
          <div className="space-y-6">
            {!legalPages.some((page) => page.apiId) && (
              <Card className="border-amber-300 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10">
                <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">
                  {p.legalPagesNotConnected}
                </CardContent>
              </Card>
            )}
          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base">{p.legalPages}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 p-2">
                  {legalPages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedLegalPage(page.id)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        selectedLegalPage === page.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      <span className="flex items-center gap-2"><FileText className="h-4 w-4" />{page.title}</span>
                      <div className="flex items-center gap-1">
                        {page.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-50" />}
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>{currentLegalPage?.title}</CardTitle>
                    <CardDescription>{p.editLegalDesc}</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a href={`/${currentLegalPage?.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                      {c.previewLabel} <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSaveCurrentLegalPage()}
                      disabled={isSaving || !currentLegalPage?.apiId}
                    >
                      {isSaving ? c.saving : p.saveLegalPage}
                    </Button>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="page-enabled" className="text-sm">{p.pageEnabled}</Label>
                      <Switch id="page-enabled" checked={currentLegalPage?.enabled} onCheckedChange={() => currentLegalPage && toggleLegalPage(currentLegalPage.id)} />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{p.pageTitle}</Label>
                    <Input value={currentLegalPage?.title || ""} onChange={(e) => currentLegalPage && updateLegalPageMeta(currentLegalPage.id, "title", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>{p.lastUpdated}</Label>
                    <Input value={currentLegalPage?.lastUpdated || ""} onChange={(e) => currentLegalPage && updateLegalPageMeta(currentLegalPage.id, "lastUpdated", e.target.value)} className="mt-1" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base">{p.contentSections}</Label>
                    <Button variant="outline" size="sm" onClick={() => currentLegalPage && addLegalSection(currentLegalPage.id)} className="gap-2">
                      <Plus className="h-4 w-4" />{p.addSection}
                    </Button>
                  </div>
                  
                  <Accordion type="multiple" className="space-y-2">
                    {currentLegalPage?.sections.sort((a, b) => a.order - b.order).map((section, index) => (
                      <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium">{index + 1}</span>
                            <span className="text-left">{section.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          <div>
                            <Label>{p.sectionTitle}</Label>
                            <Input value={section.title} onChange={(e) => currentLegalPage && updateLegalSection(currentLegalPage.id, section.id, "title", e.target.value)} className="mt-1" />
                          </div>
                          <div>
                            <Label>{c.sectionContent}</Label>
                            <Textarea value={section.content} onChange={(e) => currentLegalPage && updateLegalSection(currentLegalPage.id, section.id, "content", e.target.value)} rows={4} className="mt-1" />
                          </div>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => currentLegalPage && deleteLegalSection(currentLegalPage.id, section.id)}>
                              <Trash2 className="h-4 w-4 mr-1" />{p.deleteSection}
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
          )}
        </TabsContent>

        {/* About Us Tab */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" />{c.aboutUsPage}</CardTitle>
                  <CardDescription>{p.aboutUsDesc}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a href="/about" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    {c.previewLabel} <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    onClick={() => void handleSaveAboutPage()}
                    disabled={isSaving || aboutPageLoading || !aboutPageApiConnected}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? c.saving : p.saveAboutPage}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="about-enabled" className="text-sm">{p.pageEnabled}</Label>
                    <Switch id="about-enabled" checked={aboutPage.enabled} onCheckedChange={(checked) => setAboutPage({ ...aboutPage, enabled: checked })} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {!aboutPageApiConnected && !aboutPageLoading ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  {p.aboutPageNotConnected}
                </p>
              ) : null}
              {/* Hero Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{p.heroSection}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>{c.title}</Label>
                    <Input value={aboutPage.hero.title} onChange={(e) => setAboutPage({ ...aboutPage, hero: { ...aboutPage.hero, title: e.target.value } })} className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{p.subtitle_label}</Label>
                    <Textarea value={aboutPage.hero.subtitle} onChange={(e) => setAboutPage({ ...aboutPage, hero: { ...aboutPage.hero, subtitle: e.target.value } })} className="mt-1" rows={2} />
                  </div>
                </div>
              </div>

              {/* Story Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{p.ourStory}</h3>
                <div>
                  <Label>{p.sectionTitleLabel}</Label>
                  <Input value={aboutPage.story.title} onChange={(e) => setAboutPage({ ...aboutPage, story: { ...aboutPage.story, title: e.target.value } })} className="mt-1" />
                </div>
                <div>
                  <Label>{p.storyParagraphs}</Label>
                  {aboutPage.story.paragraphs.map((paragraph, index) => (
                    <div key={index} className="mt-2 flex gap-2">
                      <Textarea value={paragraph} onChange={(e) => { const newParagraphs = [...aboutPage.story.paragraphs]; newParagraphs[index] = e.target.value; setAboutPage({ ...aboutPage, story: { ...aboutPage.story, paragraphs: newParagraphs } }) }} rows={3} className="flex-1" />
                      <Button variant="ghost" size="icon" onClick={() => { const newParagraphs = aboutPage.story.paragraphs.filter((_, i) => i !== index); setAboutPage({ ...aboutPage, story: { ...aboutPage.story, paragraphs: newParagraphs } }) }}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={() => setAboutPage({ ...aboutPage, story: { ...aboutPage.story, paragraphs: [...aboutPage.story.paragraphs, ""] } })}><Plus className="h-4 w-4" />{p.addParagraph}</Button>
                </div>
              </div>

              {/* Mission & Vision */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{p.mission}</h3>
                  <div><Label>{c.title}</Label><Input value={aboutPage.mission.title} onChange={(e) => setAboutPage({ ...aboutPage, mission: { ...aboutPage.mission, title: e.target.value } })} className="mt-1" /></div>
                  <div><Label>{c.description}</Label><Textarea value={aboutPage.mission.description} onChange={(e) => setAboutPage({ ...aboutPage, mission: { ...aboutPage.mission, description: e.target.value } })} className="mt-1" rows={3} /></div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{p.vision}</h3>
                  <div><Label>{c.title}</Label><Input value={aboutPage.vision.title} onChange={(e) => setAboutPage({ ...aboutPage, vision: { ...aboutPage.vision, title: e.target.value } })} className="mt-1" /></div>
                  <div><Label>{c.description}</Label><Textarea value={aboutPage.vision.description} onChange={(e) => setAboutPage({ ...aboutPage, vision: { ...aboutPage.vision, description: e.target.value } })} className="mt-1" rows={3} /></div>
                </div>
              </div>

              {/* Values */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{p.companyValues}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>{c.title}</Label>
                    <Input value={aboutPage.values.title} onChange={(e) => setAboutPage({ ...aboutPage, values: { ...aboutPage.values, title: e.target.value } })} className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{p.subtitle_label}</Label>
                    <Input value={aboutPage.values.subtitle} onChange={(e) => setAboutPage({ ...aboutPage, values: { ...aboutPage.values, subtitle: e.target.value } })} className="mt-1" />
                  </div>
                  {aboutPage.values.items.map((value, index) => (
                    <div key={value.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{value.title}</Label>
                        <Switch checked={value.enabled} onCheckedChange={(checked) => { const newItems = [...aboutPage.values.items]; newItems[index] = { ...value, enabled: checked }; setAboutPage({ ...aboutPage, values: { ...aboutPage.values, items: newItems } }) }} />
                      </div>
                      <Input value={value.title} onChange={(e) => { const newItems = [...aboutPage.values.items]; newItems[index] = { ...value, title: e.target.value }; setAboutPage({ ...aboutPage, values: { ...aboutPage.values, items: newItems } }) }} placeholder={p.valueTitlePlaceholder} />
                      <Textarea value={value.description} onChange={(e) => { const newItems = [...aboutPage.values.items]; newItems[index] = { ...value, description: e.target.value }; setAboutPage({ ...aboutPage, values: { ...aboutPage.values, items: newItems } }) }} placeholder={p.descriptionPlaceholder} rows={2} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Different */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{p.whyDifferent}</h3>
                <div>
                  <Label>{p.sectionTitleLabel}</Label>
                  <Input value={aboutPage.whyDifferent.title} onChange={(e) => setAboutPage({ ...aboutPage, whyDifferent: { ...aboutPage.whyDifferent, title: e.target.value } })} className="mt-1" />
                </div>
                <div className="grid gap-4">
                  {aboutPage.whyDifferent.points.map((point, index) => (
                    <div key={point.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{point.title}</Label>
                        <Switch checked={point.enabled} onCheckedChange={(checked) => { const newPoints = [...aboutPage.whyDifferent.points]; newPoints[index] = { ...point, enabled: checked }; setAboutPage({ ...aboutPage, whyDifferent: { ...aboutPage.whyDifferent, points: newPoints } }) }} />
                      </div>
                      <Input value={point.title} onChange={(e) => { const newPoints = [...aboutPage.whyDifferent.points]; newPoints[index] = { ...point, title: e.target.value }; setAboutPage({ ...aboutPage, whyDifferent: { ...aboutPage.whyDifferent, points: newPoints } }) }} placeholder={c.title} />
                      <Textarea value={point.description} onChange={(e) => { const newPoints = [...aboutPage.whyDifferent.points]; newPoints[index] = { ...point, description: e.target.value }; setAboutPage({ ...aboutPage, whyDifferent: { ...aboutPage.whyDifferent, points: newPoints } }) }} placeholder={p.descriptionPlaceholder} rows={3} />
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{p.callToAction}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label>{c.title}</Label><Input value={aboutPage.cta.title} onChange={(e) => setAboutPage({ ...aboutPage, cta: { ...aboutPage.cta, title: e.target.value } })} className="mt-1" /></div>
                  <div className="sm:col-span-2"><Label>{p.subtitle_label}</Label><Input value={aboutPage.cta.subtitle} onChange={(e) => setAboutPage({ ...aboutPage, cta: { ...aboutPage.cta, subtitle: e.target.value } })} className="mt-1" /></div>
                  <div><Label>{p.buyerButton}</Label><Input value={aboutPage.cta.buyerButtonText} onChange={(e) => setAboutPage({ ...aboutPage, cta: { ...aboutPage.cta, buyerButtonText: e.target.value } })} className="mt-1" /></div>
                  <div><Label>{p.manufacturerButton}</Label><Input value={aboutPage.cta.manufacturerButtonText} onChange={(e) => setAboutPage({ ...aboutPage, cta: { ...aboutPage.cta, manufacturerButtonText: e.target.value } })} className="mt-1" /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
