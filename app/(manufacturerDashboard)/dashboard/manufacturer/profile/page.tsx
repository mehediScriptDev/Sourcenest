"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { countries } from "@/lib/data/countries"
import { industries } from "@/lib/data/industries"
import { 
  Factory,
  Save,
  Upload,
  Plus,
  X,
  // Globe,
  Award,
  MapPin,
  CheckCircle,
  Clock,
  Briefcase,
  Users,
  Building2,
  Languages,
  CreditCard,
  Camera,
  Loader2
} from "lucide-react"
import { useRef } from "react"
import Swal from "sweetalert2"
import { getCountryByName, getCountryByCode } from "@/lib/data/countries"
import { getManufacturerProfile, updateManufacturerProfile } from "@/lib/api/manufacturer-profile"
import { useToast } from "@/components/ui/use-toast"
import { getApiErrorMessage } from "@/lib/api/errors"

export default function ManufacturerProfilePage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [stats, setStats] = useState({
    reviewValidUntil: "Dec 2026",
    profileViews: "2,450",
    inquiries: "28",
    responseRate: "98%",
    avgResponseTime: "2 hours",
    overallProgress: 85
  })
  
  const [certifications, setCertifications] = useState<string[]>([])
  // const [exportMarkets, setExportMarkets] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [paymentTerms, setPaymentTerms] = useState<string[]>([])
  const [businessTypes, setBusinessTypes] = useState({
    manufacturer: false,
    tradingCompany: false,
    oem: false,
    odm: false
  })
  const [newCert, setNewCert] = useState("")
  // const [newMarket, setNewMarket] = useState("")
  const [newLanguage, setNewLanguage] = useState("")
  const [newPaymentTerm, setNewPaymentTerm] = useState("")
  const [oem, setOem] = useState(false)
  const [odm, setOdm] = useState(false)
  const [privateLabelEnabled, setPrivateLabelEnabled] = useState(false)
  const [customization, setCustomization] = useState(false)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [factoryImages, setFactoryImages] = useState<File[]>([])
  const [factoryImagePreviews, setFactoryImagePreviews] = useState<string[]>([])
  const [existingFactoryImages, setExistingFactoryImages] = useState<string[]>([])
  const [removeImages, setRemoveImages] = useState<string[]>([])

  const logoInputRef = useRef<HTMLInputElement>(null)
  const factoryImagesInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    companyName: "",
    shortDescription: "",
    fullDescription: "",
    yearEstablished: "",
    employeeCount: "500",
    country: "CN",
    city: "",
    address: "",
    industry: "",
    mainProducts: "",
    minimumOrder: "",
    factorySize: "",
    productionLines: "",
    annualOutput: "",
    companyType: "",
  })

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await getManufacturerProfile()
      if (res.success && res.data) {
        const p = res.data
        const c = p.company
        setProfileId(p.id)
        
        if (c) {
          setLogoPreview(c.company_logo_url || null)
          if (p.factory_images && Array.isArray(p.factory_images)) {
            // Store URLs for existing previews
            setExistingFactoryImages(p.factory_images.map((img: any) => img.url || img))
          }
          setFormData(prev => ({
            ...prev,
            companyName: c.company_name || "",
            shortDescription: c.short_description || "",
            fullDescription: c.long_description || "",
            yearEstablished: c.company_established || "",
            employeeCount: c.company_size || "500",
            country: getCountryByName(c.country || "")?.code || c.country || "CN",
            city: c.city || "",
            address: c.street_address || "",
            industry: c.industries?.[0]?.slug || "",
            minimumOrder: c.minimum_order_value?.toString() || "",
            companyType: c.company_type || "",
          }))
          
          try { if (c.certifications) setCertifications(JSON.parse(c.certifications)) } catch(e){}
          // try { if (c.export_markets) setExportMarkets(JSON.parse(c.export_markets)) } catch(e){}
          try { if (c.language_spoken) setLanguages(JSON.parse(c.language_spoken)) } catch(e){}
          try { if (c.payments_term) setPaymentTerms(JSON.parse(c.payments_term)) } catch(e){}
          
          try {
            if (c.capabilities) {
              const caps = JSON.parse(c.capabilities) as string[]
              setOem(caps.includes("OEM"))
              setOdm(caps.includes("ODM"))
              setCustomization(caps.includes("Customization") || caps.includes("Custom packaging"))
              setPrivateLabelEnabled(caps.includes("Private Label") || caps.includes("Product design"))
            }
          } catch(e){}
          
          setBusinessTypes({
            manufacturer: c.company_type === 'manufacturer' || c.company_type === 'both',
            tradingCompany: c.company_type === 'trading' || c.company_type === 'both',
            oem: false,
            odm: false
          })
        }
      }
    } catch (err: any) {
      toast({ title: "Failed to load profile", description: getApiErrorMessage(err) || String(err), variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const formDataToSend = new FormData()
      
      // Text fields — exact keys from Postman screenshot
      formDataToSend.append("company_name", formData.companyName)
      formDataToSend.append("short_description", formData.shortDescription)
      formDataToSend.append("long_description", formData.fullDescription)
      formDataToSend.append("company_established", formData.yearEstablished)
      formDataToSend.append("company_size", formData.employeeCount)
      formDataToSend.append("country", getCountryByCode(formData.country)?.name || formData.country)
      formDataToSend.append("city", formData.city)
      formDataToSend.append("street_address", formData.address)
      formDataToSend.append("minimum_order_value", formData.minimumOrder)
      
      const compType = formData.companyType || "Private Limited"
      formDataToSend.append("company_type", compType)
      formDataToSend.append("revenue", formData.annualOutput || "1000-2000")
      
      // Capabilities — only append if non-empty
      const caps: string[] = []
      if (oem) caps.push("OEM")
      if (odm) caps.push("ODM")
      if (customization) caps.push("Customization")
      if (privateLabelEnabled) caps.push("Private Label")
      
      // Arrays — must use key[] bracket notation for Laravel
      const appendAsArray = (key: string, arr: string[]) => {
        if (arr.length === 0) {
          formDataToSend.append(`${key}[]`, "")
        } else {
          arr.forEach(item => {
            formDataToSend.append(`${key}[]`, item)
          })
        }
      }

      appendAsArray("capabilities", caps)
      appendAsArray("certifications", certifications)
      // appendAsArray("export_markets", exportMarkets)
      appendAsArray("language_spoken", languages)
      appendAsArray("payments_term", paymentTerms)
      
      // Factory fields
      formDataToSend.append("factory_production", "1")
      formDataToSend.append("mulitple_factories", "0")

      // Industries — send as comma-separated IDs
      const selectedIndustry = industries.find(i => i.slug === formData.industry)
      if (selectedIndustry) {
        formDataToSend.append("industries_id", selectedIndustry.id.toString())
      }
      
      formDataToSend.append("factory_size", formData.factorySize || "5000")
      formDataToSend.append("production_lines", formData.productionLines || "3")

      // File uploads — company_logo
      if (logoFile) {
        formDataToSend.append("company_logo", logoFile)
      }
      
      // Factory images — 1-based indexing as in Postman: factory_images[1], factory_images[2]
      if (factoryImages.length > 0) {
        factoryImages.forEach((file, index) => {
          formDataToSend.append(`factory_images[${index + 1}]`, file)
        })
      }

      // Images to remove
      if (removeImages.length > 0) {
        removeImages.forEach((img, index) => {
          formDataToSend.append(`remove_images[${index}]`, img)
        })
      }

      const res = await updateManufacturerProfile(formDataToSend)
      
      if (res && res.success === false) {
        throw new Error(res.message || "Failed to update profile: validation error")
      }
      
      // Clear local file states
      setLogoFile(null)
      setFactoryImages([])
      setFactoryImagePreviews([])
      setRemoveImages([])

      // Reload profile to fetch fresh data from backend
      await loadProfile()
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: res?.message || 'Profile updated successfully',
        confirmButtonColor: '#0f172a',
      })
    } catch (err: any) {
      toast({ title: "Update failed", description: getApiErrorMessage(err) || String(err), variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">Company Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Manage how your company appears to potential buyers
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input 
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Short Description</Label>
                <Input 
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Full Description</Label>
                <Textarea 
                  value={formData.fullDescription}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  className="mt-2 min-h-[120px]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Year Established</Label>
                  <Input 
                    type="number"
                    value={formData.yearEstablished}
                    onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Employee Count</Label>
                  <Select 
                    value={formData.employeeCount}
                    onValueChange={(value) => setFormData({ ...formData, employeeCount: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">1-50</SelectItem>
                      <SelectItem value="200">51-200</SelectItem>
                      <SelectItem value="500">201-500</SelectItem>
                      <SelectItem value="1000">501-1000</SelectItem>
                      <SelectItem value="5000">1000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Country</Label>
                  <Select 
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City</Label>
                  <Input 
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Products & Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Products & Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Industry</Label>
                <Select 
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.slug} value={industry.slug}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Main Products</Label>
                <Textarea 
                  value={formData.mainProducts}
                  onChange={(e) => setFormData({ ...formData, mainProducts: e.target.value })}
                  className="mt-2"
                  placeholder="List your main products, separated by commas"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Minimum Order Value (USD)</Label>
                  <Input 
                    type="number"
                    value={formData.minimumOrder}
                    onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Annual Output (Units)</Label>
                  <Input 
                    type="number"
                    value={formData.annualOutput}
                    onChange={(e) => setFormData({ ...formData, annualOutput: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Business Type */}
              <div className="pt-4 border-t border-border">
                <Label className="text-base">Business Type</Label>
                <p className="text-sm text-muted-foreground mt-1">Select all that apply to your company</p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Manufacturer</p>
                      <p className="text-sm text-muted-foreground">Direct factory production</p>
                    </div>
                    <Switch 
                      checked={businessTypes.manufacturer} 
                      onCheckedChange={(checked) => setBusinessTypes({...businessTypes, manufacturer: checked})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Trading Company</p>
                      <p className="text-sm text-muted-foreground">Source from multiple factories</p>
                    </div>
                    <Switch 
                      checked={businessTypes.tradingCompany} 
                      onCheckedChange={(checked) => setBusinessTypes({...businessTypes, tradingCompany: checked})} 
                    />
                  </div>
                </div>
              </div>

              {/* Manufacturing Capabilities */}
              <div className="pt-4 border-t border-border">
                <Label className="text-base">Manufacturing Capabilities</Label>
                <p className="text-sm text-muted-foreground mt-1">Services you offer to buyers</p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">OEM Services</p>
                      <p className="text-sm text-muted-foreground">Original Equipment Manufacturing</p>
                    </div>
                    <Switch checked={oem} onCheckedChange={setOem} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">ODM Services</p>
                      <p className="text-sm text-muted-foreground">Original Design Manufacturing</p>
                    </div>
                    <Switch checked={odm} onCheckedChange={setOdm} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Private Label</p>
                      <p className="text-sm text-muted-foreground">White-label manufacturing services</p>
                    </div>
                    <Switch checked={privateLabelEnabled} onCheckedChange={setPrivateLabelEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Customization</p>
                      <p className="text-sm text-muted-foreground">Custom modifications and specifications</p>
                    </div>
                    <Switch checked={customization} onCheckedChange={setCustomization} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Factory Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Factory Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Factory Size (sqm)</Label>
                  <Input 
                    type="number"
                    value={formData.factorySize}
                    onChange={(e) => setFormData({ ...formData, factorySize: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Production Lines</Label>
                  <Input 
                    type="number"
                    value={formData.productionLines}
                    onChange={(e) => setFormData({ ...formData, productionLines: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {certifications.map((cert) => (
                  <Badge key={cert} variant="secondary" className="gap-1 pr-1">
                    {cert}
                    <button 
                      onClick={() => setCertifications(certifications.filter(c => c !== cert))}
                      className="ml-1 rounded-full p-0.5 hover:bg-background/50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add certification..."
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (newCert.trim()) {
                      setCertifications([...certifications, newCert.trim()])
                      setNewCert("")
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                You can upload certification documents in the Certifications section
              </p>
            </CardContent>
          </Card>

          {/* Export Markets — disabled until export_markets_section plan feature is enabled
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Export Markets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {exportMarkets.map((market) => (
                  <Badge key={market} variant="outline" className="gap-1 pr-1">
                    {market}
                    <button 
                      onClick={() => setExportMarkets(exportMarkets.filter(m => m !== market))}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add export market..."
                  value={newMarket}
                  onChange={(e) => setNewMarket(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (newMarket.trim()) {
                      setExportMarkets([...exportMarkets, newMarket.trim()])
                      setNewMarket("")
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          */}

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Languages Spoken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="gap-1 pr-1">
                    {lang}
                    <button 
                      onClick={() => setLanguages(languages.filter(l => l !== lang))}
                      className="ml-1 rounded-full p-0.5 hover:bg-background/50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add language..."
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (newLanguage.trim()) {
                      setLanguages([...languages, newLanguage.trim()])
                      setNewLanguage("")
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Languages your team can communicate in
              </p>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Terms Accepted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {paymentTerms.map((term) => (
                  <Badge key={term} variant="outline" className="gap-1 pr-1">
                    {term}
                    <button 
                      onClick={() => setPaymentTerms(paymentTerms.filter(t => t !== term))}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add payment term..."
                  value={newPaymentTerm}
                  onChange={(e) => setNewPaymentTerm(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (newPaymentTerm.trim()) {
                      setPaymentTerms([...paymentTerms, newPaymentTerm.trim()])
                      setNewPaymentTerm("")
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Common options: T/T, L/C, D/P, D/A, PayPal, Western Union
              </p>
            </CardContent>
          </Card>

          {/* Factory Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Factory Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload photos of your factory, production lines, and facilities to build trust with buyers
              </p>
              <input 
                type="file" 
                ref={factoryImagesInputRef} 
                className="hidden" 
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const newFiles = Array.from(e.target.files)
                    setFactoryImages([...factoryImages, ...newFiles])
                    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
                    setFactoryImagePreviews([...factoryImagePreviews, ...newPreviews])
                  }
                }}
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {existingFactoryImages.map((preview, i) => (
                  <div key={`existing-${i}`} className="aspect-video rounded-lg border-2 border-border overflow-hidden relative group">
                    <img src={preview} alt={`Factory ${i}`} className="w-full h-full object-cover" />
                    <button 
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                         setRemoveImages([...removeImages, preview]);
                         const newExisting = [...existingFactoryImages];
                         newExisting.splice(i, 1);
                         setExistingFactoryImages(newExisting);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {factoryImagePreviews.map((preview, i) => (
                  <div key={`new-${i}`} className="aspect-video rounded-lg border-2 border-border overflow-hidden relative group">
                    <img src={preview} alt={`Factory ${i}`} className="w-full h-full object-cover" />
                    <button 
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                         const newImages = [...factoryImages]; 
                         newImages.splice(i, 1); 
                         setFactoryImages(newImages);
                         
                         const newPreviews = [...factoryImagePreviews]; 
                         newPreviews.splice(i, 1); 
                         setFactoryImagePreviews(newPreviews);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {(existingFactoryImages.length + factoryImagePreviews.length) < 6 && (
                  <div 
                    className="aspect-video rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center cursor-pointer hover:border-secondary transition-colors"
                    onClick={() => factoryImagesInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">Upload</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Recommended: High-quality photos showing production areas, equipment, and quality control processes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLogoFile(e.target.files[0])
                      setLogoPreview(URL.createObjectURL(e.target.files[0]))
                    }
                  }}
                />
                <div 
                  className="flex h-32 w-32 items-center justify-center rounded-2xl bg-muted cursor-pointer overflow-hidden relative group"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Company Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Factory className="h-16 w-16 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                     <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <Button variant="outline" className="mt-4 gap-2" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </Button>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Recommended: 400x400px, PNG or JPG
                </p>
              </div>
            </CardContent>
          </Card>


          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg bg-emerald-100 p-4">
                <CheckCircle className="h-5 w-5 text-emerald-700" />
                <div>
                  <p className="font-medium text-emerald-700">Approved</p>
                  <p className="text-sm text-emerald-600">Your profile is live</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completeness */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Completeness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall Progress</span>
                  <span className="text-sm font-medium text-foreground">85%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full w-[85%] rounded-full bg-secondary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete your profile to attract more buyers
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span className="text-muted-foreground">Basic information</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span className="text-muted-foreground">Company logo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span className="text-muted-foreground">Certifications</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  <span className="text-muted-foreground">Factory photos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  <span className="text-muted-foreground">Video introduction</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Profile Views (30d)</span>
                <span className="font-medium text-foreground">2,450</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inquiries (30d)</span>
                <span className="font-medium text-foreground">28</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Response Rate</span>
                <span className="font-medium text-foreground">98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Response Time</span>
                <span className="font-medium text-foreground">2 hours</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
