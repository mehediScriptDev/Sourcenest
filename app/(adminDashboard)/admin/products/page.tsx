"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Swal from "sweetalert2"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import * as Icons from "lucide-react"
import { getAdminProducts, updateAdminProductApprovalStatus, deleteAdminProduct } from "@/lib/api/admin-products"
import type { AdminProduct, AdminProductMeta } from "@/lib/api/admin-products"
import { useTranslation } from "@/lib/i18n"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { queryKeys } from "@/lib/query-keys"

const iconMap: Record<string, React.ReactNode> = {
  Factory: <Icons.Factory className="h-7 w-7" />,
  Hammer: <Icons.Hammer className="h-7 w-7" />,
  Leaf: <Icons.Leaf className="h-7 w-7" />,
  Pickaxe: <Icons.Pickaxe className="h-7 w-7" />,
  Zap: <Icons.Zap className="h-7 w-7" />,
  Truck: <Icons.Truck className="h-7 w-7" />,
  Heart: <Icons.Heart className="h-7 w-7" />,
  BookOpen: <Icons.BookOpen className="h-7 w-7" />,
  Cpu: <Icons.Cpu className="h-7 w-7" />,
  Cog: <Icons.Cog className="h-7 w-7" />,
  Headphones: <Icons.Headphones className="h-7 w-7" />,
  Shirt: <Icons.Shirt className="h-7 w-7" />,
  Apple: <Icons.Apple className="h-7 w-7" />,
  Wrench: <Icons.Wrench className="h-7 w-7" />,
  Package: <Icons.Package className="h-7 w-7" />,
}

function getDynamicIcon(iconName: string) {
  return iconMap[iconName] || iconMap.Package
}

export default function AdminProductsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.products
  const c = t.admin.common
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryClient = useQueryClient()
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())

  // Get query parameters
  const search = searchParams.get("search") ?? ""
  const isApprovedFilter = searchParams.get("is_approved") ?? "all"
  const perPage = parseInt(searchParams.get("per_page") ?? "20", 10)
  const page = parseInt(searchParams.get("page") ?? "1", 10)

  // Update URL query parameters
  const updateQueryParams = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(params).forEach(([key, value]) => {
      if (value === "" || value === "all") {
        newParams.delete(key)
      } else {
        newParams.set(key, String(value))
      }
    })
    router.push(`/admin/products?${newParams.toString()}`)
  }

  const queryFilters: Record<string, unknown> = { page, per_page: perPage }
  if (search) queryFilters.search = search
  if (isApprovedFilter !== "all") {
    queryFilters.is_approved = isApprovedFilter === "1" ? 1 : 0
  }

  const productsQueryKey = queryKeys.adminProducts(page, perPage, search, isApprovedFilter)

  const productsQuery = useQuery({
    queryKey: productsQueryKey,
    queryFn: () => getAdminProducts(page, queryFilters),
    placeholderData: (previousData) => previousData,
  })

  const products = productsQuery.data?.success ? productsQuery.data.data : []
  const meta = productsQuery.data?.success ? productsQuery.data.meta : null
  const error = productsQuery.data?.success === false ? (productsQuery.data.message || p.fetchFailed) : null

  const updateApprovalMutation = useMutation({
    mutationFn: ({ productId, isApproved }: { productId: number; isApproved: boolean }) =>
      updateAdminProductApprovalStatus(productId, isApproved),
  })

  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) => deleteAdminProduct(productId),
  })

  // Handle product approval status update
  const handleApprovalStatusChange = async (
    productId: number,
    isApproved: boolean
  ) => {
    setUpdatingIds((prev) => new Set([...prev, productId]))
    const response = await updateApprovalMutation.mutateAsync({ productId, isApproved })
    
    if (response.success) {
      queryClient.setQueryData(productsQueryKey, (previous: {
        success: boolean
        data: AdminProduct[]
        meta: AdminProductMeta | null
        message?: string
      } | undefined) => {
        if (!previous?.success) return previous
        return {
          ...previous,
          data: previous.data.map((product) =>
            product.id === productId ? { ...product, is_approved: isApproved } : product
          ),
        }
      })
      
      // Show success alert
      await Swal.fire({
        icon: "success",
        title: c.success,
        text: isApproved ? p.productApproved : p.productRejected,
        confirmButtonText: c.ok,
        confirmButtonColor: "#503322",
        customClass: {
          confirmButton: "rounded-lg px-6 py-2 font-semibold",
        },
      })
    } else {
      // Show error alert
      await Swal.fire({
        icon: "error",
        title: c.error,
        text: response.message || p.updateStatusFailed,
        confirmButtonText: c.ok,
        confirmButtonColor: "#6366f1",
        customClass: {
          confirmButton: "rounded-lg px-6 py-2 font-semibold",
        },
      })
    }
    
    setUpdatingIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(productId)
      return newSet
    })
  }

  // Handle product deletion
  const handleDeleteProduct = async (productId: number, productName: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: p.deleteProduct,
      text: p.deleteConfirmNamed.replace("{name}", productName),
      showCancelButton: true,
      confirmButtonText: c.delete,
      cancelButtonText: c.cancel,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      customClass: {
        confirmButton: "rounded-lg px-6 py-2 font-semibold",
        cancelButton: "rounded-lg px-6 py-2 font-semibold",
      },
    })

    if (!result.isConfirmed) {
      return
    }

    setUpdatingIds((prev) => new Set([...prev, productId]))
    const response = await deleteProductMutation.mutateAsync(productId)
    
    if (response.success) {
      queryClient.setQueryData(productsQueryKey, (previous: {
        success: boolean
        data: AdminProduct[]
        meta: AdminProductMeta | null
        message?: string
      } | undefined) => {
        if (!previous?.success) return previous

        const nextProducts = previous.data.filter((product) => product.id !== productId)
        const nextMeta = previous.meta
          ? { ...previous.meta, total: Math.max(previous.meta.total - 1, 0) }
          : previous.meta

        return {
          ...previous,
          data: nextProducts,
          meta: nextMeta,
        }
      })
      
      // Show success alert
      await Swal.fire({
        icon: "success",
        title: c.deleted,
        text: p.productDeleted,
        confirmButtonText: c.ok,
        confirmButtonColor: "#503322",
        customClass: {
          confirmButton: "rounded-lg px-6 py-2 font-semibold",
        },
      })
    } else {
      // Show error alert
      await Swal.fire({
        icon: "error",
        title: c.error,
        text: response.message || p.deleteFailed,
        confirmButtonText: c.ok,
        confirmButtonColor: "#6366f1",
        customClass: {
          confirmButton: "rounded-lg px-6 py-2 font-semibold",
        },
      })
    }
    
    setUpdatingIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(productId)
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">
          {p.title}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {p.subtitle}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Icons.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={c.searchProducts}
            value={search}
            onChange={(e) =>
              updateQueryParams({ search: e.target.value, page: 1 })
            }
            className="pl-9"
          />
        </div>
        {/* <Select
          value={isApprovedFilter}
          onValueChange={(value) =>
            updateQueryParams({ is_approved: value, page: 1 })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={p.approvalStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{c.allStatus}</SelectItem>
            <SelectItem value="1">{c.approved}</SelectItem>
            <SelectItem value="0">{c.pending}</SelectItem>
          </SelectContent>
        </Select> */}
      </div>

      {/* Loading State */}
      {productsQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{p.loading}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Products Grid */}
      {!productsQuery.isLoading && products.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{p.noProducts}</p>
        </div>
      )}

      {!productsQuery.isLoading && (
        <>
          <div className="grid gap-4">
            {products.map((product) => {
              const minPrice =
                product.pricing_quantities?.min_price.price.amount ?? "0"
              const maxPrice =
                product.pricing_quantities?.max_price.price.amount ?? "0"
              const currency =
                product.pricing_quantities?.currency.symbol ?? "$"
              const priceRange = `${currency}${minPrice} - ${currency}${maxPrice}`
              const isUpdating = updatingIds.has(product.id)

              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      {getDynamicIcon(product.category.displayIcon)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icons.Factory className="h-3 w-3" />
                        {product.category.name}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm">
                        <Badge variant="outline">
                          {product.sub_category.name}
                        </Badge>
                        <span className="font-medium text-foreground">
                          {priceRange}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isUpdating}>
                          <Icons.MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteProduct(product.id, product.name)
                          }
                          disabled={isUpdating}
                          className="cursor-pointer text-destructive"
                        >
                          <Icons.Trash2 className="mr-2 h-4 w-4" />
                          {c.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>

          <AdminPagination
            page={page}
            meta={meta}
            itemCount={products.length}
            onPageChange={(nextPage) => updateQueryParams({ page: nextPage })}
            variant="card"
            className="mt-2"
          />
        </>
      )}
    </div>
  )
}
