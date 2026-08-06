"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ManufacturerStatCard from "@/components/manufacturer/manufacturer-stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Globe, 
  Plus, 
  Search, 
  TrendingUp,
  Users,
  Package,
  MapPin,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { 
  getManufacturerMarkets, 
  getExportCountries, 
  syncExportCountries,
  createRegionCountries, 
  updateRegionCountries,
  deleteRegion,
  type ActiveRegion, 
  type SuggestionMarket, 
  type ExportCountry, 
  type MarketStats 
} from "@/lib/api/manufacturer-markets"
import { useTranslation } from "@/lib/i18n"

const SUPPLIER_MAP_GROUPS = ["Africa", "Americas", "Asia", "Europe", "Oceania"] as const

export default function ExportMarketsPage() {
  const { t } = useTranslation()
  const m = t.mfg.markets
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<MarketStats | null>(null)
  const [activeRegions, setActiveRegions] = useState<ActiveRegion[]>([])
  const [suggestions, setSuggestions] = useState<SuggestionMarket[]>([])
  const [availableCountries, setAvailableCountries] = useState<ExportCountry[]>([])
  const [metaRegions, setMetaRegions] = useState<string[]>([])
  const [mapGroups, setMapGroups] = useState<string[]>([])
  
  const [initialSelectedCountries, setInitialSelectedCountries] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])

  const [selectedMapGroup, setSelectedMapGroup] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [managingMarket, setManagingMarket] = useState<ActiveRegion | null>(null)
  const [newMarketRegion, setNewMarketRegion] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const [marketsRes, countriesRes] = await Promise.all([
        getManufacturerMarkets(),
        getExportCountries({ per_page: 250 })
      ])
      
      if (marketsRes.success && marketsRes.data) {
        setStats(marketsRes.data.stats)
        setActiveRegions(marketsRes.data.active_regions || [])
        setSuggestions(marketsRes.data.suggestions || [])
        setMetaRegions(marketsRes.data.meta?.regions || [])
        setMapGroups(
          marketsRes.data.meta?.geographic_regions?.length
            ? marketsRes.data.meta.geographic_regions
            : [...SUPPLIER_MAP_GROUPS]
        )
      }
      
      if (countriesRes.success && countriesRes.data) {
        setAvailableCountries(countriesRes.data)
        const selected = countriesRes.data.filter(c => c.is_selected).map(c => c.code)
        setSelectedCountries(selected)
        setInitialSelectedCountries(selected)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.loadError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveChanges = async () => {
    const hasChanged =
      initialSelectedCountries.length !== selectedCountries.length ||
      initialSelectedCountries.some((code) => !selectedCountries.includes(code))

    if (!hasChanged) {
      toast.info(m.noChanges)
      return
    }

    try {
      setSaving(true)
      const res = await syncExportCountries(selectedCountries)

      if (res.success) {
        toast.success(m.successUpdate)
        await loadData()
      } else {
        toast.error(m.saveFailed)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.updateFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleAddMarket = async () => {
    if (!newMarketRegion) {
      toast.error(m.selectRegionError)
      return
    }
    try {
      setSaving(true)
      const regionCountryCodes = availableCountries
        .filter(c => c.export_market_region === newMarketRegion && selectedCountries.includes(c.code))
        .map(c => c.code)

      const existingActiveRegion = activeRegions.find(r => r.region === newMarketRegion)
      let res
      if (existingActiveRegion) {
        res = await updateRegionCountries(existingActiveRegion.id, regionCountryCodes)
      } else {
        res = await createRegionCountries(newMarketRegion, regionCountryCodes)
      }

      if (res.success) {
        toast.success(`Region ${newMarketRegion} updated successfully`)
        await loadData()
      } else {
        toast.error(res.message || m.addRegionFailed)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.addRegionFailed)
    } finally {
      setSaving(false)
      setShowAddDialog(false)
      setNewMarketRegion("")
    }
  }

  const handleRemoveRegion = async (regionName: string) => {
    const existingActiveRegion = activeRegions.find(r => r.region === regionName)
    if (!existingActiveRegion) return

    try {
      setSaving(true)
      const res = await deleteRegion(existingActiveRegion.id)
      if (res.success) {
        toast.success(`Region ${regionName} removed successfully`)
        await loadData()
      } else {
        toast.error(res.message || m.removeRegionFailed)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.removeRegionFailed)
    } finally {
      setSaving(false)
      setShowManageDialog(false)
    }
  }

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries(prev => 
      prev.includes(countryCode) 
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    )
  }

  const exportRegionOptions = metaRegions

  const mapGroupOptions =
    mapGroups.length > 0
      ? mapGroups
      : [...SUPPLIER_MAP_GROUPS]

  const filteredCountries = availableCountries.filter(c => {
    const matchesMapGroup = selectedMapGroup ? c.geographic_region === selectedMapGroup : true
    const matchesQuery = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesMapGroup && matchesQuery
  })

  if (loading) {
    return (
      <div className="min-w-0 space-y-6 overflow-x-hidden">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded bg-muted animate-pulse" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="w-full overflow-hidden">
              <CardContent className="p-4 sm:p-5 py-0 sm:py-0">
                <div className="flex items-center gap-3 animate-pulse py-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-12 rounded bg-muted" />
                    <div className="h-6 w-20 rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Regions Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-64 rounded bg-muted animate-pulse mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-border animate-pulse gap-3">
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-lg bg-muted shrink-0" />
                  <div className="space-y-2">
                    <div className="h-5 w-32 rounded bg-muted" />
                    <div className="h-4 w-64 rounded bg-muted" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-12 rounded bg-muted" />
                  <div className="h-8 w-12 rounded bg-muted" />
                  <div className="h-8 w-16 rounded bg-muted" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
          <p className="text-muted-foreground">{m.subtitle}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {m.addNewMarket}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <ManufacturerStatCard
          title={m.activeMarkets}
          value={selectedCountries.length}
          icon={Globe}
          layout="horizontal"
        />
        <ManufacturerStatCard
          title={m.totalInquiries}
          value={stats?.total_inquiries ?? 0}
          icon={Users}
          iconClassName="text-primary"
          iconWrapperClassName="bg-primary/20"
          layout="horizontal"
        />
        <ManufacturerStatCard
          title={m.orders}
          value={stats?.total_orders ?? 0}
          icon={Package}
          iconClassName="text-green-600"
          iconWrapperClassName="bg-green-500/20"
          layout="horizontal"
        />
        <ManufacturerStatCard
          title={m.growthRate}
          value={stats?.growth_rate.value ?? "+0.0%"}
          icon={TrendingUp}
          iconClassName="text-amber-600"
          iconWrapperClassName="bg-amber-500/20"
          layout="horizontal"
        />
      </div>

      {/* Current Markets */}
      <Card>
        <CardHeader>
          <CardTitle>{m.activeRegions}</CardTitle>
          <CardDescription>{m.activeRegionsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeRegions.length > 0 ? (
              activeRegions.map((market) => {
                const activeCountriesInRegion = availableCountries
                  .filter(c => c.export_market_region === market.region && selectedCountries.includes(c.code))
                  .map(c => c.name)

                return (
                  <div key={market.region} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="rounded-lg bg-secondary/20 p-2 shrink-0">
                        <MapPin className="h-5 w-5 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{market.region}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {activeCountriesInRegion.length > 0 
                            ? activeCountriesInRegion.join(", ") 
                            : m.noCountriesSelected}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                      <div className="flex justify-between sm:justify-end w-full sm:w-auto gap-4">
                        <div className="text-left sm:text-right">
                          <p className="font-medium">{market.inquiries}</p>
                          <p className="text-xs text-muted-foreground">{m.inquiries}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-medium">{market.orders}</p>
                          <p className="text-xs text-muted-foreground">{m.orders}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setManagingMarket(market)
                          setShowManageDialog(true)
                        }}
                      >
                        {m.manage}
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                {m.noActiveRegions}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suggested Markets */}
      <Card>
        <CardHeader>
          <CardTitle>{m.suggestedMarkets}</CardTitle>
          <CardDescription>{m.suggestedMarketsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
            {suggestions.length > 0 ? (
              suggestions.map((market) => (
                <div key={market.region} className="p-4 rounded-lg border border-dashed border-border hover:border-secondary transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{market.region}</p>
                    <Badge variant={market.potential_key === "high" || market.potential === "High" ? "default" : "secondary"}>
                      {market.potential} Potential
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{market.reason}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setNewMarketRegion(market.region)
                      setShowAddDialog(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Market
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6 col-span-3">
                No suggestions available at this time.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Country Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Target Countries</CardTitle>
          <CardDescription>Choose specific countries where you can export your products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={m.searchCountries} 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedMapGroup === null ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedMapGroup(null)}
              >
                All
              </Button>
              {mapGroupOptions.map((group) => (
                <Button 
                  key={group}
                  variant={selectedMapGroup === group ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSelectedMapGroup(group)}
                >
                  {group}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-96 overflow-y-auto p-1">
            {filteredCountries.map((country) => (
              <div 
                key={country.code}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedCountries.includes(country.code) 
                    ? "border-secondary bg-secondary/10" 
                    : "border-border hover:bg-muted"
                }`}
                onClick={() => toggleCountry(country.code)}
              >
                <Checkbox 
                  checked={selectedCountries.includes(country.code)}
                  onCheckedChange={() => toggleCountry(country.code)}
                />
                <span className="text-sm">{country.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedCountries.length} countries selected
            </p>
            <Button onClick={handleSaveChanges} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? m.saving : m.saveMarkets}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Market Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Export Market</DialogTitle>
            <DialogDescription>
              Select a region to add to your export markets
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Region</Label>
              <Select 
                value={newMarketRegion}
                onValueChange={setNewMarketRegion}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={m.selectRegion} />
                </SelectTrigger>
                <SelectContent>
                  {exportRegionOptions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Countries</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose specific countries within this region
              </p>
              <div className="mt-3 max-h-48 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
                {newMarketRegion ? (
                  availableCountries.filter(c => c.export_market_region === newMarketRegion).map((country) => (
                    <div 
                      key={country.code}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleCountry(country.code)}
                    >
                      <Checkbox 
                        checked={selectedCountries.includes(country.code)}
                        onCheckedChange={() => toggleCountry(country.code)}
                      />
                      <span className="text-sm">{country.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Select a region first
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setNewMarketRegion("")
            }} disabled={saving}>Cancel</Button>
            <Button onClick={handleAddMarket} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Market
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Market Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage {managingMarket?.region}</DialogTitle>
            <DialogDescription>
              View and manage countries in this export market
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{managingMarket?.inquiries}</p>
                <p className="text-sm text-muted-foreground">Total Inquiries</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{managingMarket?.orders}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
            <div>
              <Label>Countries in this market</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                {managingMarket && availableCountries
                  .filter(c => c.export_market_region === managingMarket.region && selectedCountries.includes(c.code))
                  .map((country) => (
                    <div 
                      key={country.code}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <span>{country.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          toggleCountry(country.code)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageDialog(false)} disabled={saving}>Close</Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (managingMarket) {
                  handleRemoveRegion(managingMarket.region)
                }
              }}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Market
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
