"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Swal from "sweetalert2"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ManufacturerStatCard from "@/components/manufacturer/manufacturer-stat-card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  FileBox,
  Upload,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  File,
  Calendar,
  Search,
  Info
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getManufacturerCatalogs,
  deleteManufacturerCatalog,
  changeManufacturerCatalogStatus,
  getManufacturerCatalogStats,
  downloadManufacturerCatalog,
  previewManufacturerCatalog,
  uploadManufacturerCatalog,
} from "@/lib/api/manufacturer-catalogs"
import type { ManufacturerCatalog, ManufacturerCatalogStats } from "@/lib/api/manufacturer-catalogs"
import { useTranslation } from "@/lib/i18n"

const localT = {
  en: {
    pageTitle: "Factory Catalogs",
    pageSubtitle: "Upload and manage your product catalogs (PDF)",
    uploadCatalog: "Upload Catalog",
    totalCatalogs: "Total Catalogs",
    activeCatalogs: "Active Catalogs",
    inactiveCatalogs: "Inactive Catalogs",
    allStatus: "All Status",
    active: "Active",
    inactive: "Inactive",
    loadingCatalogs: "Loading catalogs...",
    deleteCatalogTitle: "Delete Catalog?",
    deleteCatalogDesc: "This action cannot be undone.",
    deleteBtn: "Delete",
    cancelBtn: "Cancel",
    deletedTitle: "Deleted!",
    deletedSuccess: "Catalog deleted successfully",
    okBtn: "OK",
    errorTitle: "Error",
    deleteFailed: "Failed to delete catalog",
    successTitle: "Success!",
    publishedSuccess: "Catalog published successfully",
    unpublishedSuccess: "Catalog unpublished successfully",
    statusChangeFailed: "Failed to change catalog status",
    preview: "Preview",
    download: "Download",
    downloading: "Downloading...",
    setAsInactive: "Set as Inactive",
    publish: "Publish",
    downloadsCount: "downloads",
    pageOf: "Page {page} of {lastPage}",
    previous: "Previous",
    next: "Next",
    previewDetailsTitle: "Catalog Preview & Details",
    previewDetailsDesc: "View and manage catalog information",
    pdfNotice: "📄 Click \"Open in New Tab\" to preview the PDF in a new window, or \"Download\" to save it locally.",
    filePath: "File Path",
    fileSize: "File Size",
    totalDownloads: "Total Downloads",
    created: "Created",
    updated: "Updated",
    openInNewTab: "Open in New Tab",
    close: "Close",
    catalogName: "Catalog Name",
    pdfFile: "PDF File",
    dragDropPrompt: "Click to upload or drag and drop",
    pdfSizeLimit: "PDF up to 50MB",
    missingFields: "Missing Fields",
    missingFieldsDesc: "Please provide both catalog name and PDF file",
    uploading: "Uploading...",
    upload: "Upload",
    noCatalogs: "No catalogs uploaded yet.",
    uploadFirst: "Upload Your First Catalog",
    notFound: "No catalogs found",
    uploadSuccess: "Catalog uploaded successfully",
    uploadFailed: "Failed to upload catalog",
    downloadFailed: "Failed to download catalog",
    statusLabel: "Status"
  },
  ar: {
    pageTitle: "كتالوجات المصنع",
    pageSubtitle: "تحميل وإدارة كتالوجات المنتجات الخاصة بك (PDF)",
    uploadCatalog: "تحميل كتالوج",
    totalCatalogs: "إجمالي الكتالوجات",
    activeCatalogs: "الكتالوجات النشطة",
    inactiveCatalogs: "الكتالوجات غير النشطة",
    allStatus: "جميع الحالات",
    active: "نشط",
    inactive: "غير نشط",
    loadingCatalogs: "جاري تحميل الكتالوجات...",
    deleteCatalogTitle: "حذف الكتالوج؟",
    deleteCatalogDesc: "هذا الإجراء لا يمكن التراجع عنه.",
    deleteBtn: "حذف",
    cancelBtn: "إلغاء",
    deletedTitle: "تم الحذف!",
    deletedSuccess: "تم حذف الكتالوج بنجاح",
    okBtn: "موافق",
    errorTitle: "خطأ",
    deleteFailed: "فشل حذف الكتالوج",
    successTitle: "نجاح!",
    publishedSuccess: "تم نشر الكتالوج بنجاح",
    unpublishedSuccess: "تم إلغاء نشر الكتالوج بنجاح",
    statusChangeFailed: "فشل تغيير حالة الكتالوج",
    preview: "معاينة",
    download: "تنزيل",
    downloading: "جاري التنزيل...",
    setAsInactive: "تعيين كغير نشط",
    publish: "نشر",
    downloadsCount: "تنزيلات",
    pageOf: "صفحة {page} من {lastPage}",
    previous: "السابق",
    next: "التالي",
    previewDetailsTitle: "معاينة وتفاصيل الكتالوج",
    previewDetailsDesc: "عرض وإدارة معلومات الكتالوج",
    pdfNotice: "📄 انقر على \"فتح في علامة تبويب جديدة\" لمعاينة ملف PDF في نافذة جديدة، أو \"تنزيل\" لحفظه محليًا.",
    filePath: "مسار الملف",
    fileSize: "حجم الملف",
    totalDownloads: "إجمالي التنزيلات",
    created: "تاريخ الإنشاء",
    updated: "تاريخ التحديث",
    openInNewTab: "فتح في علامة تبويب جديدة",
    close: "إغلاق",
    catalogName: "اسم الكتالوج",
    pdfFile: "ملف PDF",
    dragDropPrompt: "انقر للتحميل أو اسحب الملف وأفلته هنا",
    pdfSizeLimit: "ملف PDF يصل إلى 50 ميجابايت",
    missingFields: "حقول مفقودة",
    missingFieldsDesc: "يرجى تقديم كل من اسم الكتالوج وملف PDF",
    uploading: "جاري التحميل...",
    upload: "تحميل",
    noCatalogs: "لم يتم تحميل أي كتالوجات بعد.",
    uploadFirst: "قم بتحميل كتالوجك الأول",
    notFound: "لم يتم العثور على كتالوجات",
    uploadSuccess: "تم تحميل الكتالوج بنجاح",
    uploadFailed: "فشل تحميل الكتالوج",
    downloadFailed: "فشل تنزيل الكتالوج",
    statusLabel: "الحالة"
  },
  he: {
    pageTitle: "קטלוגי מפעל",
    pageSubtitle: "העלאה וניהול של קטלוגי המוצרים שלך (PDF)",
    uploadCatalog: "העלה קטלוג",
    totalCatalogs: "סך הכל קטלוגים",
    activeCatalogs: "קטלוגים פעילים",
    inactiveCatalogs: "קטלוגים לא פעילים",
    allStatus: "כל הסטטוסים",
    active: "פעיל",
    inactive: "לא פעיל",
    loadingCatalogs: "טוען קטלוגים...",
    deleteCatalogTitle: "למחוק את הקטלוג?",
    deleteCatalogDesc: "פעולה זו אינה ניתנת לביטול.",
    deleteBtn: "מחק",
    cancelBtn: "ביטול",
    deletedTitle: "נמחק!",
    deletedSuccess: "הקטלוג נמחק בהצלחה",
    okBtn: "אישור",
    errorTitle: "שגיאה",
    deleteFailed: "מחיקת הקטלוג נכשלה",
    successTitle: "הצלחה!",
    publishedSuccess: "הקטלוג פורסם בהצלחה",
    unpublishedSuccess: "פרסום הקטלוג בוטל בהצלחה",
    statusChangeFailed: "שינוי סטטוס הקטלוג נכשל",
    preview: "תצוגה מקדימה",
    download: "הורדה",
    downloading: "מוריד...",
    setAsInactive: "הגדר כלא פעיל",
    publish: "פרסם",
    downloadsCount: "הורדות",
    pageOf: "עמוד {page} מתוך {lastPage}",
    previous: "הקודם",
    next: "הבא",
    previewDetailsTitle: "תצוגה מקדימה ופרטי קטלוג",
    previewDetailsDesc: "צפה ונהל את פרטי הקטלוג",
    pdfNotice: "📄 לחץ על \"פתח בלשונית חדשה\" כדי לצפות ב-PDF בחלון חדש, או על \"הורד\" כדי לשמור אותו במחשב.",
    filePath: "נתיב קובץ",
    fileSize: "גודל קובץ",
    totalDownloads: "סך הכל הורדות",
    created: "נוצר",
    updated: "עודכן",
    openInNewTab: "פתח בלשונית חדשה",
    close: "סגור",
    catalogName: "שם הקטלוג",
    pdfFile: "קובץ PDF",
    dragDropPrompt: "לחץ כדי להעלות או גרור ושחרר קובץ",
    pdfSizeLimit: "PDF עד 50MB",
    missingFields: "שדות חסרים",
    missingFieldsDesc: "אנא ספק גם את שם הקטלוג וגם את קובץ ה-PDF",
    uploading: "מעלה...",
    upload: "העלאה",
    noCatalogs: "טרם הועלו קטלוגים.",
    uploadFirst: "העלה את הקטלוג הראשון שלך",
    notFound: "לא נמצאו קטלוגים",
    uploadSuccess: "הקטלוג הועלה בהצלחה",
    uploadFailed: "העלאת הקטלוג נכשלה",
    downloadFailed: "הורדת הקטלוג נכשלה",
    statusLabel: "סטטוס"
  },
  es: {
    pageTitle: "工厂目录",
    pageSubtitle: "上传并管理您的产品目录 (PDF)",
    uploadCatalog: "上传目录",
    totalCatalogs: "目录总数",
    activeCatalogs: "已激活目录",
    inactiveCatalogs: "未激活目录",
    allStatus: "所有状态",
    active: "已激活",
    inactive: "未激活",
    loadingCatalogs: "正在加载目录...",
    deleteCatalogTitle: "删除目录？",
    deleteCatalogDesc: "此操作无法撤销。",
    deleteBtn: "删除",
    cancelBtn: "取消",
    deletedTitle: "已删除！",
    deletedSuccess: "目录删除成功",
    okBtn: "确定",
    errorTitle: "错误",
    deleteFailed: "删除目录失败",
    successTitle: "成功！",
    publishedSuccess: "目录发布成功",
    unpublishedSuccess: "目录取消发布成功",
    statusChangeFailed: "更改目录状态失败",
    preview: "预览",
    download: "下载",
    downloading: "正在下载...",
    setAsInactive: "设为未激活",
    publish: "发布",
    downloadsCount: "次下载",
    pageOf: "第 {page} 页，共 {lastPage} 页",
    previous: "上一页",
    next: "下一页",
    previewDetailsTitle: "目录预览与详情",
    previewDetailsDesc: "查看和管理目录信息",
    pdfNotice: "📄 点击“在新标签页中打开”可在新窗口中预览 PDF，或点击“下载”将其保存至本地。",
    filePath: "文件路径",
    fileSize: "文件大小",
    totalDownloads: "下载次数",
    created: "创建时间",
    updated: "更新时间",
    openInNewTab: "在新标签页中打开",
    close: "关闭",
    catalogName: "目录名称",
    pdfFile: "PDF 文件",
    dragDropPrompt: "点击上传或将文件拖拽至此处",
    pdfSizeLimit: "最大支持 50MB 的 PDF 文件",
    missingFields: "必填项缺失",
    missingFieldsDesc: "请提供目录名称和 PDF 文件",
    uploading: "正在上传...",
    upload: "上传",
    noCatalogs: "尚未上传任何目录。",
    uploadFirst: "上传您的第一个目录",
    notFound: "未找到目录",
    uploadSuccess: "目录上传成功",
    uploadFailed: "目录上传失败",
    downloadFailed: "目录下载失败",
    statusLabel: "状态"
  }
}


export default function ManufacturerCatalogsPage() {
  const { t, locale } = useTranslation()
  const local = localT[locale as keyof typeof localT] || localT.en
  const router = useRouter()
  const searchParams = useSearchParams()

  const [catalogs, setCatalogs] = useState<ManufacturerCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastPage, setLastPage] = useState(1)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [statusChangeIds, setStatusChangeIds] = useState<Set<number>>(new Set())
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set())
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [newCatalog, setNewCatalog] = useState({ name: "", file: null as File | null, status: "active" as "active" | "inactive" })
  const [stats, setStats] = useState<ManufacturerCatalogStats | null>(null)
  const [selectedCatalog, setSelectedCatalog] = useState<ManufacturerCatalog | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [uploadingCatalog, setUploadingCatalog] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewingId, setPreviewingId] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get query parameters
  const status = searchParams.get("status") ?? "all"
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const perPage = parseInt(searchParams.get("per_page") ?? "10", 10)

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
    router.push(`/dashboard/manufacturer/catalogs?${newParams.toString()}`)
  }

  // Fetch catalogs and stats when query params change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      const params: Record<string, unknown> = {
        page,
        per_page: perPage,
      }

      if (status !== "all") {
        params.status = status
      }

      const [catalogResponse, statsResponse] = await Promise.all([
        getManufacturerCatalogs(page, params),
        getManufacturerCatalogStats(),
      ])

      if (catalogResponse.success) {
        setCatalogs(catalogResponse.data)
        setLastPage(catalogResponse.meta?.lastPage ?? 1)
      } else {
        setError(catalogResponse.message || "Failed to fetch catalogs")
        setCatalogs([])
      }

      if (statsResponse.success) {
        setStats(statsResponse.data)
      }

      setLoading(false)
    }

    fetchData()
  }, [status, page, perPage])

  // Handle delete catalog
  const handleDeleteCatalog = async (id: number) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: local.deleteCatalogTitle,
      text: local.deleteCatalogDesc,
      confirmButtonText: local.deleteBtn,
      cancelButtonText: local.cancelBtn,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    })

    if (!confirm.isConfirmed) return

    setDeletingIds((prev) => new Set([...prev, id]))
    const response = await deleteManufacturerCatalog(id)

    if (response.success) {
      setCatalogs((prev) => prev.filter((c) => c.id !== id))
      await Swal.fire({
        icon: "success",
        title: local.deletedTitle,
        text: local.deletedSuccess,
        confirmButtonText: local.okBtn,
        confirmButtonColor: "#6366f1",
      })
    } else {
      await Swal.fire({
        icon: "error",
        title: local.errorTitle,
        text: response.message || local.deleteFailed,
        confirmButtonText: local.okBtn,
        confirmButtonColor: "#6366f1",
      })
    }

    setDeletingIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  // Handle status change
  const handleStatusChange = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    
    setStatusChangeIds((prev) => new Set([...prev, id]))
    const response = await changeManufacturerCatalogStatus(id, newStatus as "active" | "inactive")

    if (response.success) {
      setCatalogs((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: newStatus as "active" | "inactive" } : c
        )
      )
      await Swal.fire({
        icon: "success",
        title: local.successTitle,
        text: newStatus === "active" ? local.publishedSuccess : local.unpublishedSuccess,
        confirmButtonText: local.okBtn,
        confirmButtonColor: "#6366f1",
      })
    } else {
      await Swal.fire({
        icon: "error",
        title: local.errorTitle,
        text: response.message || local.statusChangeFailed,
        confirmButtonText: local.okBtn,
        confirmButtonColor: "#6366f1",
      })
    }

    setStatusChangeIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const activeCount = catalogs.filter((c) => c.status === "active").length

  function toNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }
    return fallback
  }

  // Handle preview catalog
  const handlePreview = async (id: number) => {
    setSelectedCatalog(null)
    setPreviewUrl(null)
    setPreviewingId(id)
    
    const catalog = catalogs.find(c => c.id === id)
    if (catalog) {
      setSelectedCatalog(catalog)
      
      // Try to get preview URL from API
      const response = await previewManufacturerCatalog(id)
      if (response.success && response.url) {
        setPreviewUrl(response.url)
      } else {
        // Fallback to file_path if available
        setPreviewUrl(catalog.file_path)
      }
      
      setShowDetailsModal(true)
    }
    
    setPreviewingId(null)
  }

  // Handle download catalog
  const handleDownload = async (id: number) => {
    setDownloadingIds((prev) => new Set([...prev, id]))
    
    const catalog = catalogs.find(c => c.id === id)
    if (!catalog) {
      await Swal.fire({
        icon: "error",
        title: local.errorTitle,
        text: local.notFound,
        confirmButtonText: local.okBtn,
        confirmButtonColor: "#6366f1",
      })
      setDownloadingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      return
    }

    try {
      // Use the file_path directly as it's a full URL from backend
      const fileUrl = catalog.file_path
      const fileName = `${catalog.name}.pdf`
      
      const a = document.createElement("a")
      a.href = fileUrl
      a.download = fileName
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: local.errorTitle,
        text: local.downloadFailed,
        confirmButtonText: local.okBtn,
        confirmButtonColor: "#6366f1",
      })
    }

    setDownloadingIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{local.pageTitle}</h1>
          <p className="mt-1 text-muted-foreground">
            {local.pageSubtitle}
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          {local.uploadCatalog}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <ManufacturerStatCard
          title={local.totalCatalogs}
          value={stats?.total_catalogs ?? 0}
          icon={FileBox}
          layout="horizontal"
        />
        <ManufacturerStatCard
          title={local.activeCatalogs}
          value={stats?.active_catalogs ?? 0}
          icon={FileBox}
          iconClassName="text-emerald-700"
          iconWrapperClassName="bg-emerald-100"
          layout="horizontal"
        />
        <ManufacturerStatCard
          title={local.inactiveCatalogs}
          value={stats?.inactive_catalogs ?? 0}
          icon={FileBox}
          iconClassName="text-slate-700"
          iconWrapperClassName="bg-slate-100"
          layout="horizontal"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select
          value={status}
          onValueChange={(value) =>
            updateQueryParams({ status: value, page: 1 })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={local.statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{local.allStatus}</SelectItem>
            <SelectItem value="active">{local.active}</SelectItem>
            <SelectItem value="inactive">{local.inactive}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{local.loadingCatalogs}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Catalogs List */}
      {!loading && (
        <>
          <div className="grid gap-4">
            {catalogs.map((catalog) => {
              const isDeleting = deletingIds.has(catalog.id)
              const isChangingStatus = statusChangeIds.has(catalog.id)

              return (
                <Card key={catalog.id} className="w-full overflow-hidden relative">
                  <CardContent className="p-4 sm:p-5">
                    {/* Mobile: floating menu at top-right to avoid centering under stacked buttons */}
                    <div className="absolute right-4 top-4 sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting || isChangingStatus}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(catalog.id, catalog.status)}
                            disabled={isChangingStatus}
                          >
                            {catalog.status === "active" ? local.setAsInactive : local.publish}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteCatalog(catalog.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t.common.delete || "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <File className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground truncate">{catalog.name}</h3>
                            <Badge className={catalog.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                              {catalog.status === "active" ? local.active : local.inactive}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                            <span className="truncate">{catalog.file_size}</span>
                            <span className="flex items-center gap-1 truncate">
                              <Calendar className="h-3 w-3" />
                              {new Date(catalog.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <Download className="h-3 w-3" />
                              {catalog.total_downloads} {local.downloadsCount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 w-full sm:w-auto justify-center"
                          onClick={() => handlePreview(catalog.id)}
                        >
                          <Eye className="h-3 w-3" />
                          {local.preview}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 w-full sm:w-auto justify-center"
                          disabled={downloadingIds.has(catalog.id)}
                          onClick={() => handleDownload(catalog.id)}
                        >
                          <Download className="h-3 w-3" />
                          {downloadingIds.has(catalog.id) ? local.downloading : local.download}
                        </Button>
                        {/* Inline menu for sm+ */}
                        <div className="hidden sm:block">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isDeleting || isChangingStatus}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(catalog.id, catalog.status)}
                                disabled={isChangingStatus}
                              >
                                {catalog.status === "active" ? local.setAsInactive : local.publish}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteCatalog(catalog.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t.common.delete || "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {catalogs.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileBox className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">{local.noCatalogs}</p>
                  <Button onClick={() => setShowUploadDialog(true)} className="mt-4">
                    {local.uploadFirst}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() =>
                  updateQueryParams({ page: Math.max(1, page - 1) })
                }
              >
                {local.previous}
              </Button>
              <span className="text-sm text-muted-foreground">
                {local.pageOf.replace('{page}', String(page)).replace('{lastPage}', String(lastPage))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === lastPage}
                onClick={() =>
                  updateQueryParams({ page: Math.min(lastPage, page + 1) })
                }
              >
                {local.next}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Catalog Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{local.previewDetailsTitle}</DialogTitle>
            <DialogDescription>
              {local.previewDetailsDesc}
            </DialogDescription>
          </DialogHeader>
          {selectedCatalog && (
            <div className="space-y-4">
              {/* PDF Preview Info */}
              {previewUrl && (
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <p className="text-sm text-blue-900">
                    {local.pdfNotice}
                  </p>
                </div>
              )}

              <div className="flex items-start gap-4 border-t pt-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted shrink-0">
                  <File className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">{selectedCatalog.name}</h3>
                  <Badge className={selectedCatalog.status === "active" ? "mt-1 bg-emerald-100 text-emerald-700" : "mt-1 bg-slate-100 text-slate-700"}>
                    {selectedCatalog.status === "active" ? local.active : local.inactive}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{local.filePath}</p>
                  <p className="mt-1 break-all text-foreground font-mono text-xs bg-muted p-2 rounded">
                    {selectedCatalog.file_path}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{local.fileSize}</p>
                    <p className="mt-1 text-sm text-foreground">{selectedCatalog.file_size}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{local.totalDownloads}</p>
                    <p className="mt-1 text-sm text-foreground">{selectedCatalog.total_downloads}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{local.created}</p>
                    <p className="mt-1 text-sm text-foreground">
                      {new Date(selectedCatalog.created_at).toLocaleDateString()} {new Date(selectedCatalog.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{local.updated}</p>
                    <p className="mt-1 text-sm text-foreground">
                      {new Date(selectedCatalog.updated_at).toLocaleDateString()} {new Date(selectedCatalog.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                {previewUrl && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                    {local.openInNewTab}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={() => handleDownload(selectedCatalog.id)}
                  disabled={downloadingIds.has(selectedCatalog.id)}
                >
                  <Download className="h-4 w-4" />
                  {downloadingIds.has(selectedCatalog.id) ? local.downloading : local.download}
                </Button>
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1"
                >
                  {local.close}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{local.uploadCatalog}</DialogTitle>
            <DialogDescription>
              {local.pageSubtitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{local.catalogName}</Label>
              <Input 
                placeholder="e.g., 2026 Product Catalog"
                value={newCatalog.name}
                onChange={(e) => setNewCatalog({ ...newCatalog, name: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>{local.statusLabel}</Label>
              <Select
                value={newCatalog.status}
                onValueChange={(value) =>
                  setNewCatalog({ ...newCatalog, status: value as "active" | "inactive" })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={local.statusLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{local.active}</SelectItem>
                  <SelectItem value="inactive">{local.inactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{local.pdfFile}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setNewCatalog({ ...newCatalog, file })
                  }
                }}
              />
              <div 
                className="mt-2 rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-secondary transition-colors cursor-pointer sm:p-8"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const files = e.dataTransfer?.files
                  if (files && files[0]) {
                    setNewCatalog({ ...newCatalog, file: files[0] })
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {newCatalog.file ? newCatalog.file.name : local.dragDropPrompt}
                </p>
                <p className="text-xs text-muted-foreground">{local.pdfSizeLimit}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setNewCatalog({ name: "", file: null, status: "active" })
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
                setShowUploadDialog(false)
              }}
              disabled={uploadingCatalog}
            >
              {local.cancelBtn}
            </Button>
            <Button 
              onClick={async () => {
                if (!newCatalog.name || !newCatalog.file) {
                  await Swal.fire({
                    icon: "warning",
                    title: local.missingFields,
                    text: local.missingFieldsDesc,
                    confirmButtonText: local.okBtn,
                    confirmButtonColor: "#6366f1",
                  })
                  return
                }

                setUploadingCatalog(true)
                const formData = new FormData()
                formData.append("name", newCatalog.name)
                formData.append("status", newCatalog.status)
                formData.append("catalog", newCatalog.file)

                const response = await uploadManufacturerCatalog(formData)

                if (response.success) {
                  setNewCatalog({ name: "", file: null, status: "active" })
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                  setShowUploadDialog(false)
                  
                  await Swal.fire({
                    icon: "success",
                    title: local.successTitle,
                    text: local.uploadSuccess,
                    confirmButtonText: local.okBtn,
                    confirmButtonColor: "#6366f1",
                  })
                  
                  // Refresh catalog list
                  const params: Record<string, unknown> = {
                    page,
                    per_page: perPage,
                  }
                  if (status !== "all") {
                    params.status = status
                  }
                  const catalogResponse = await getManufacturerCatalogs(page, params)
                  if (catalogResponse.success) {
                    setCatalogs(catalogResponse.data)
                    setLastPage(catalogResponse.meta?.lastPage ?? 1)
                  }
                } else {
                  await Swal.fire({
                    icon: "error",
                    title: local.errorTitle,
                    text: response.message || local.uploadFailed,
                    confirmButtonText: local.okBtn,
                    confirmButtonColor: "#6366f1",
                  })
                }

                setUploadingCatalog(false)
              }}
              disabled={uploadingCatalog || !newCatalog.name || !newCatalog.file}
            >
              {uploadingCatalog ? local.uploading : local.upload}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
