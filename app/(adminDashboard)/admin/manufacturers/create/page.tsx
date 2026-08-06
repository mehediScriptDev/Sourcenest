"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { countries as allCountries } from "@/lib/data/countries"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/api/errors"
import { getAdminCategories } from "@/lib/api/categories"
import { getAdminCertificateTypes } from "@/lib/api/admin-certificate-types"
import { getAdminQuickFilterOptions } from "@/lib/api/admin-quick-filters"
import { 
  Factory,
  Mail,
  Lock,
  Building2,
  MapPin,
  Globe,
  Phone,
  User,
  Eye,
  EyeOff,
  Send,
  Save,
  CheckCircle,
  AlertCircle,
  Copy,
  Plus,
  X,
  Award,
  Package,
  Users
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function AdminCreateManufacturerPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.createManufacturer
  const c = t.admin.common
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const { toast } = useToast()

  // Dynamic data from API with fallback defaults
  const [certificationTypes, setCertificationTypes] = useState<string[]>([
    "ISO 9001", "ISO 14001", "ISO 45001", "CE Marking", "FDA", "GMP", "BSCI", "SEDEX", "SA8000", "REACH", "RoHS", "UL", "FCC", "IATF 16949"
  ])
  const [businessTypes, setBusinessTypes] = useState<string[]>([
    "Manufacturer", "Trading Company", "Manufacturer & Trading", "OEM Manufacturer", "ODM Manufacturer", "Contract Manufacturer"
  ])
  const [capabilities, setCapabilities] = useState<string[]>([
    "Private Label", "OEM Service", "ODM Service", "Custom Packaging", "Drop Shipping", "Quality Inspection", "Product Development", "Custom Design"
  ])
  const [exportMarkets, setExportMarkets] = useState<string[]>([])
  const [categories, setCategories] = useState<Array<{id: number; name: string}>>([])
  
  // Account Info
  const [accountForm, setAccountForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    sendCredentials: true
  })
  
  // Company Info
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    businessType: "",
    yearEstablished: "",
    employeeCount: "",
    annualRevenue: "",
    description: "",
    website: "",
    businessLicense: ""
  })
  
  // Location
  const [locationForm, setLocationForm] = useState({
    country: "",
    city: "",
    address: "",
    postalCode: "",
    phone: ""
  })
  
  // Business Details
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([])
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([])
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [selectedExportMarkets, setSelectedExportMarkets] = useState<string[]>([])
  
  // Products
  const [mainProducts, setMainProducts] = useState<string[]>([])
  const [newProduct, setNewProduct] = useState("")

  // Fetch dynamic data from API
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        setIsLoadingData(true)
        
        // Fetch categories (Industries)
        try {
          const catRes = await getAdminCategories({ perPage: 100 })
          if (catRes.success && catRes.data) {
            setCategories(catRes.data.map(cat => ({ id: Number(cat.id), name: cat.name })))
          } else {
            // Fallback direct request
            const rawCatRes = await apiClient.get("/admin/categories")
            const rawData = rawCatRes.data?.data || rawCatRes.data || []
            if (Array.isArray(rawData)) {
              setCategories(rawData.map((cat: any) => ({ id: cat.id, name: cat.name })))
            }
          }
        } catch (err) {
          console.log("Categories endpoint not available, using empty list")
        }

        // Fetch certifications
        try {
          const certRes = await getAdminCertificateTypes("", 1, 100)
          if (certRes.success && certRes.data && certRes.data.length > 0) {
            setCertificationTypes(certRes.data.filter(c => c.status === "active").map(c => c.name))
          } else {
            const qfRes = await getAdminQuickFilterOptions("certifications")
            if (qfRes.success && qfRes.data && qfRes.data.length > 0) {
              setCertificationTypes(qfRes.data.filter(o => o.isEnabled).map(o => o.displayLabel || o.value))
            }
          }
        } catch (err) {
          console.log("Certifications endpoint not available, using defaults")
        }

        // Fetch business types
        try {
          const bizRes = await apiClient.get("/api/business-types")
          const bizData = bizRes.data?.data || bizRes.data
          if (Array.isArray(bizData)) {
            setBusinessTypes(bizData)
          } else {
            const qfRes = await getAdminQuickFilterOptions("business_types")
            if (qfRes.success && qfRes.data && qfRes.data.length > 0) {
              setBusinessTypes(qfRes.data.filter(o => o.isEnabled).map(o => o.displayLabel || o.value))
            }
          }
        } catch (err) {
          console.log("Business types endpoint not available, using defaults")
        }

        // Fetch capabilities
        try {
          const capRes = await apiClient.get("/api/capabilities")
          const capData = capRes.data?.data || capRes.data
          if (Array.isArray(capData)) {
            setCapabilities(capData)
          } else {
            const qfRes = await getAdminQuickFilterOptions("capabilities")
            if (qfRes.success && qfRes.data && qfRes.data.length > 0) {
              setCapabilities(qfRes.data.filter(o => o.isEnabled).map(o => o.displayLabel || o.value))
            }
          }
        } catch (err) {
          console.log("Capabilities endpoint not available, using defaults")
        }

        // Fetch export markets
        try {
          const mkRes = await apiClient.get("/api/export-markets")
          const mkData = mkRes.data?.data || mkRes.data
          if (Array.isArray(mkData)) {
            setExportMarkets(mkData)
          } else {
            const qfRes = await getAdminQuickFilterOptions("export_markets")
            if (qfRes.success && qfRes.data && qfRes.data.length > 0) {
              setExportMarkets(qfRes.data.filter(o => o.isEnabled).map(o => o.displayLabel || o.value))
            }
          }
        } catch (err) {
          console.log("Export markets endpoint not available, using defaults")
        }

        setIsLoadingData(false)
      } catch (err) {
        console.error("Error fetching dynamic data:", err)
        setIsLoadingData(false)
      }
    }

    fetchDynamicData()
  }, [])
  
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setAccountForm({ ...accountForm, password })
  }

  const toggleIndustry = (industryId: number) => {
    setSelectedIndustries(prev => 
      prev.includes(industryId) 
        ? prev.filter(i => i !== industryId)
        : [...prev, industryId]
    )
  }

  const toggleCapability = (capability: string) => {
    setSelectedCapabilities(prev => 
      prev.includes(capability) 
        ? prev.filter(c => c !== capability)
        : [...prev, capability]
    )
  }

  const toggleCertification = (cert: string) => {
    setSelectedCertifications(prev => 
      prev.includes(cert) 
        ? prev.filter(c => c !== cert)
        : [...prev, cert]
    )
  }

  const toggleExportMarket = (market: string) => {
    setSelectedExportMarkets(prev => 
      prev.includes(market) 
        ? prev.filter(m => m !== market)
        : [...prev, market]
    )
  }

  const addProduct = () => {
    if (newProduct.trim() && !mainProducts.includes(newProduct.trim())) {
      setMainProducts(prev => [...prev, newProduct.trim()])
      setNewProduct("")
    }
  }

  const removeProduct = (product: string) => {
    setMainProducts(prev => prev.filter(p => p !== product))
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!accountForm.email || !accountForm.password || !companyForm.companyName || !locationForm.country) {
      toast({ title: c.missingRequiredFields, description: p.missingFields, variant: "destructive" })
      return
    }

    setIsSaving(true)

    // selectedIndustries already contains numeric IDs from /admin/categories
    const industries_id = selectedIndustries

    const payload: Record<string, any> = {
      email: accountForm.email,
      password: accountForm.password,
      send_email: !!accountForm.sendCredentials,

      country: locationForm.country,
      industries_id: industries_id,
      capabilities: selectedCapabilities,
      certifications: selectedCertifications,
      export_markets: selectedExportMarkets,
    }

    // Add optional fields if provided
    if (accountForm.firstName) payload.first_name = accountForm.firstName
    if (accountForm.lastName) payload.last_name = accountForm.lastName

    if (companyForm.companyName) payload.company_name = companyForm.companyName
    if (companyForm.businessType) payload.company_type = companyForm.businessType
    if (companyForm.yearEstablished) payload.company_established = companyForm.yearEstablished
    if (companyForm.employeeCount) payload.company_size = companyForm.employeeCount
    if (companyForm.annualRevenue) payload.revenue = companyForm.annualRevenue
    if (companyForm.businessLicense) payload.bussiness_license = companyForm.businessLicense
    if (companyForm.website) payload.company_website = companyForm.website
    if (companyForm.description) payload.notes = companyForm.description

    if (locationForm.city) payload.city = locationForm.city
    if (locationForm.address) payload.street_address = locationForm.address
    if (locationForm.phone) payload.phone = locationForm.phone
    if (locationForm.postalCode) payload.zip_code = locationForm.postalCode

    try {
      // Try /admin/manufacturer/create endpoint first, fallback to /admin/manufacturers
      const endpoints = ["/admin/manufacturer/create", "/admin/manufacturers"]
      let res: any = null
      for (const ep of endpoints) {
        try {
          res = await apiClient.post(ep, payload)
          if (res && (res.status === 200 || res.status === 201 || res.data)) break
        } catch (err: any) {
          // 404 -> try next endpoint
          if (err?.response?.status === 404) continue
          throw err
        }
      }

      if (!res) throw new Error("Create failed: no response from server")

      setIsSaving(false)

      // Show success alert with credentials
      await Swal.fire({
        icon: "success",
        title: p.createdSuccess,
        html: `
          <div style="text-align: left; margin-top: 20px;">
            <p><strong>${c.createdSuccessEmail}</strong></p>
            <p style="font-family: monospace; background-color: #f0f0f0; padding: 8px; border-radius: 4px; word-break: break-all;">${accountForm.email}</p>
            <p style="margin-top: 15px;"><strong>${c.createdSuccessPassword}</strong></p>
            <p style="font-family: monospace; background-color: #f0f0f0; padding: 8px; border-radius: 4px;">${accountForm.password}</p>
            ${accountForm.sendCredentials ? `<p style="margin-top: 15px; color: #10b981;"><strong>✓</strong> ${c.credentialsSentNote.replace("{email}", accountForm.email)}</p>` : ""}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: c.viewManufacturers,
        cancelButtonText: c.createAnother,
        confirmButtonColor: "#3b82f6",
        cancelButtonColor: "#6b7280",
      }).then((result: any) => {
        if (result.isConfirmed) {
          resetForm()
          router.push("/admin/manufacturers")
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          resetForm()
        }
      })

    } catch (err) {
      setIsSaving(false)
      const errorMsg = getApiErrorMessage(err) || String(err)
      
      Swal.fire({
        icon: "error",
        title: p.createFailed,
        text: errorMsg,
        confirmButtonColor: "#ef4444"
      })
    }
  }

  const resetForm = () => {
    setAccountForm({ email: "", password: "", firstName: "", lastName: "", sendCredentials: true })
    setCompanyForm({ companyName: "", businessType: "", yearEstablished: "", employeeCount: "", annualRevenue: "", description: "", website: "", businessLicense: "" })
    setLocationForm({ country: "", city: "", address: "", postalCode: "", phone: "" })
    setSelectedIndustries([])
    setSelectedCapabilities([])
    setSelectedCertifications([])
    setExportMarkets([])
    setMainProducts([])
    setCurrentStep(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{p.title}</h1>
          <p className="text-muted-foreground">
            {p.subtitle.replace("{step}", String(currentStep)).replace("{total}", "4")}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex-1">
            <div className={`h-2 rounded-full ${currentStep >= step ? "bg-primary" : "bg-muted"}`} />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {step === 1 && p.stepAccount}
              {step === 2 && p.stepCompany}
              {step === 3 && c.stepLocation}
              {step === 4 && c.stepBusiness}
            </p>
          </div>
        ))}
      </div>

      {/* Step 1: Account Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.accountInformation}</CardTitle>
            <CardDescription>
              {c.accountInformationDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{c.firstName}</Label>
                <Input 
                  value={accountForm.firstName}
                  onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })}
                  className="mt-2"
                  placeholder={p.contactFirstName}
                />
              </div>
              <div>
                <Label>{c.lastName}</Label>
                <Input 
                  value={accountForm.lastName}
                  onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })}
                  className="mt-2"
                  placeholder={p.contactLastName}
                />
              </div>
            </div>

            <div>
              <Label>{c.emailAddress}</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  className="pl-9"
                  placeholder={p.emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <Label>{c.passwordRequired}</Label>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    className="pl-9 pr-10"
                    placeholder={p.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  {c.generate}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <Switch 
                checked={accountForm.sendCredentials}
                onCheckedChange={(checked) => setAccountForm({ ...accountForm, sendCredentials: checked })}
              />
              <div>
                <Label>{c.sendCredentialsEmail}</Label>
                <p className="text-sm text-muted-foreground">
                  {c.sendCredentialsEmailDesc}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)} 
                disabled
                className="w-32"
              >
                {c.previous}
              </Button>
              <Button 
                className="w-32" 
                onClick={() => {
                  if (!accountForm.email || !accountForm.password) {
                    toast({ title: c.missingRequiredFields, description: c.emailPasswordRequired, variant: "destructive" })
                    return
                  }
                  setCurrentStep(2)
                }}
              >
                {c.next}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Company Information */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.companyInformation}</CardTitle>
            <CardDescription>
              {c.companyInformationDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>{c.company} *</Label>
              <Input 
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                className="mt-2"
                placeholder={p.companyPlaceholder}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{c.businessType}</Label>
                <Select 
                  value={companyForm.businessType}
                  onValueChange={(value) => setCompanyForm({ ...companyForm, businessType: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={p.selectType} />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{c.yearEstablished}</Label>
                <Input 
                  type="number"
                  value={companyForm.yearEstablished}
                  onChange={(e) => setCompanyForm({ ...companyForm, yearEstablished: e.target.value })}
                  className="mt-2"
                  placeholder={c.yearPlaceholder}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{c.numberOfEmployees}</Label>
                <Select 
                  value={companyForm.employeeCount}
                  onValueChange={(value) => setCompanyForm({ ...companyForm, employeeCount: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={c.selectRange} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">{c.emp1to10}</SelectItem>
                    <SelectItem value="11-50">{c.emp11to50}</SelectItem>
                    <SelectItem value="51-100">{c.emp51to100}</SelectItem>
                    <SelectItem value="101-500">{c.emp101to500}</SelectItem>
                    <SelectItem value="501-1000">{c.emp501to1000}</SelectItem>
                    <SelectItem value="1000+">{c.emp1000plus}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{c.annualRevenue}</Label>
                <Select 
                  value={companyForm.annualRevenue}
                  onValueChange={(value) => setCompanyForm({ ...companyForm, annualRevenue: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={c.selectRange} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="< $1M">{c.lessThan1M}</SelectItem>
                    <SelectItem value="$1M - $5M">{c.revenue1to5M}</SelectItem>
                    <SelectItem value="$5M - $10M">{c.revenue5to10M}</SelectItem>
                    <SelectItem value="$10M - $50M">{c.revenue10to50M}</SelectItem>
                    <SelectItem value="$50M - $100M">{c.revenue50to100M}</SelectItem>
                    <SelectItem value="> $100M">{c.moreThan100M}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{c.companyDescription}</Label>
              <Textarea 
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                className="mt-2"
                rows={4}
                placeholder={c.briefDescriptionPlaceholder}
              />
            </div>

            <div>
              <Label>{c.website}</Label>
              <div className="relative mt-2">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  className="pl-9"
                  placeholder={c.websitePlaceholder}
                />
              </div>
            </div>

            <div>
              <Label>{c.businessLicenseNo}</Label>
              <Input
                value={companyForm.businessLicense}
                onChange={(e) => setCompanyForm({ ...companyForm, businessLicense: e.target.value })}
                className="mt-2"
                placeholder={c.licensePlaceholder}
              />
            </div>

            <div className="flex gap-3 pt-4 justify-between">
              <Button 
                variant="outline"
                className="w-32"
                onClick={() => setCurrentStep(1)}
              >
                {c.previous}
              </Button>
              <Button 
                className="w-32"
                onClick={() => {
                  if (!companyForm.companyName) {
                    toast({ title: c.missingRequiredFields, description: c.companyNameRequired, variant: "destructive" })
                    return
                  }
                  setCurrentStep(3)
                }}
              >
                {c.next}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Location Details */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.locationDetails}</CardTitle>
            <CardDescription>
              {c.locationDetailsDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{c.country} *</Label>
                <Select 
                  value={locationForm.country}
                  onValueChange={(value) => setLocationForm({ ...locationForm, country: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={p.selectCountry} />
                  </SelectTrigger>
                  <SelectContent>
                    {allCountries.map(country => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{c.city}</Label>
                <Input 
                  value={locationForm.city}
                  onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                  className="mt-2"
                  placeholder={c.cityPlaceholder}
                />
              </div>
            </div>

            <div>
              <Label>{c.streetAddress}</Label>
              <Input 
                value={locationForm.address}
                onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                className="mt-2"
                placeholder={c.streetPlaceholder}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{c.postalCode}</Label>
                <Input 
                  value={locationForm.postalCode}
                  onChange={(e) => setLocationForm({ ...locationForm, postalCode: e.target.value })}
                  className="mt-2"
                  placeholder={c.postalPlaceholder}
                />
              </div>
              <div>
                <Label>{c.phoneNumber}</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    value={locationForm.phone}
                    onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                    className="pl-9"
                    placeholder={c.phonePlaceholder}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-between">
              <Button 
                variant="outline"
                className="w-32"
                onClick={() => setCurrentStep(2)}
              >
                {c.previous}
              </Button>
              <Button 
                className="w-32"
                onClick={() => {
                  if (!locationForm.country) {
                    toast({ title: c.missingRequiredFields, description: c.countryRequired, variant: "destructive" })
                    return
                  }
                  setCurrentStep(4)
                }}
              >
                {c.next}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Business Details */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Industries */}
          <Card>
            <CardHeader>
              <CardTitle>{c.industriesSection}</CardTitle>
              <CardDescription>
                {c.industriesSectionDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge
                    key={category.id}
                    variant={selectedIndustries.includes(category.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleIndustry(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>{c.capabilitiesSection}</CardTitle>
              <CardDescription>
                {c.capabilitiesSectionDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {capabilities.map(cap => (
                  <div 
                    key={cap}
                    className="flex items-center gap-2"
                  >
                    <Checkbox 
                      checked={selectedCapabilities.includes(cap)}
                      onCheckedChange={() => toggleCapability(cap)}
                    />
                    <span className="text-sm">{cap}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>{c.certificationsSection}</CardTitle>
              <CardDescription>
                {c.certificationsSectionDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {certificationTypes.map(cert => (
                  <Badge
                    key={cert}
                    variant={selectedCertifications.includes(cert) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCertification(cert)}
                  >
                    <Award className="mr-1 h-3 w-3" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Markets */}
          <Card>
            <CardHeader>
              <CardTitle>{c.exportMarketsSection}</CardTitle>
              <CardDescription>
                {c.exportMarketsSectionDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(exportMarkets.length > 0 ? exportMarkets : [
                  c.northAmerica,
                  c.southAmerica,
                  c.westernEurope,
                  c.easternEurope,
                  c.middleEast,
                  c.africa,
                  c.southeastAsia,
                  c.eastAsia,
                  c.southAsia,
                  c.oceania,
                ]).map(market => (
                  <Badge
                    key={market}
                    variant={selectedExportMarkets.includes(market) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleExportMarket(market)}
                  >
                    <Globe className="mr-1 h-3 w-3" />
                    {market}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between">
            <Button 
              variant="outline"
              className="w-32"
              onClick={() => setCurrentStep(3)}
            >
              {c.previous}
            </Button>
            <Button 
              className="w-auto px-6" 
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {c.creatingManufacturer}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {c.createManufacturer}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
