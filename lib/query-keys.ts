export const queryKeys = {
  adminProducts: (
    page: number,
    perPage: number,
    search: string,
    isApprovedFilter: string
  ) => ["admin-products", page, perPage, search, isApprovedFilter] as const,
  adminOrders: (
    page: number,
    perPage: number,
    search: string,
    statusFilter: string
  ) => ["admin-orders", page, perPage, search, statusFilter] as const,
  adminOrderStats: () => ["admin-order-stats"] as const,
  adminReviews: (
    page: number,
    statusFilter: string,
    ratingFilter: string,
    searchQuery: string
  ) => ["admin-reviews", page, statusFilter, ratingFilter, searchQuery] as const,
  adminReviewStats: () => ["admin-review-stats"] as const,
  adminSubscriptions: (
    page: number,
    perPage: number,
    statusFilter: string,
    searchQuery: string
  ) => ["admin-subscriptions", page, perPage, statusFilter, searchQuery] as const,
  adminSubscriptionStats: () => ["admin-subscription-stats"] as const,
  adminContacts: (page: number, perPage: number, search: string) =>
    ["admin-contacts", page, perPage, search] as const,
  adminAnalyticsMetrics: () => ["admin-analytics-metrics"] as const,
  adminAnalyticsGrowth: () => ["admin-analytics-growth"] as const,
  adminAnalyticsCountries: () => ["admin-analytics-countries"] as const,
  adminAnalyticsIndustries: () => ["admin-analytics-industries"] as const,
  adminSupplierReports: (
    currentPage: number,
    statusFilter: string,
    priorityFilter: string,
    perPage: number
  ) => ["admin-supplier-reports", currentPage, statusFilter, priorityFilter, perPage] as const,
  adminSupplierReportDetail: (reportId: number) => ["admin-supplier-report", reportId] as const,
  adminQuickFilterCounts: () => ["admin-quick-filter-counts"] as const,
  adminQuickFilterTypes: () => ["admin-quick-filter-types"] as const,
  adminQuickFilterOptions: (type: string) => ["admin-quick-filter-options", type] as const,
  adminSuppliers: (
    page: number,
    perPage: number,
    statusFilter: string,
    search: string
  ) => ["admin-suppliers", page, perPage, statusFilter, search] as const,
  adminUsers: (
    page: number,
    perPage: number,
    search: string,
    roleFilter: string,
    statusFilter: string
  ) => ["admin-users", page, perPage, search, roleFilter, statusFilter] as const,
  adminUserDetail: (userId: string) => ["admin-user", userId] as const,
  adminManufacturerRegistrations: (page: number, perPage: number) =>
    ["admin-manufacturer-registrations", page, perPage] as const,
  adminRfqs: (
    page: number,
    perPage: number,
    statusFilter: string,
    search: string
  ) => ["admin-rfqs", page, perPage, statusFilter, search] as const,
  adminReviewManagement: (
    page: number,
    perPage: number,
    statusFilter: string,
    search: string
  ) => ["admin-review-management", page, perPage, statusFilter, search] as const,
  adminPromotions: () => ["admin-promotions"] as const,
  adminPromotionDetail: (id: string | number) => ["admin-promotion-detail", id] as const,
  adminPricingPlans: () => ["admin-pricing-plans"] as const,
  adminPlanFeatures: () => ["admin-plan-features"] as const,
  adminIndustries: (page: number, perPage: number, search: string) =>
    ["admin-industries", page, perPage, search] as const,
  adminHelpCategories: () => ["admin-help-categories"] as const,
  adminHelpArticles: (categoryId: number) => ["admin-help-articles", categoryId] as const,
  adminFaqCategories: () => ["admin-faq-categories"] as const,
  adminDashboard: () => ["admin-dashboard"] as const,
  adminCertificateTypes: (page: number, perPage: number, search: string) =>
    ["admin-certificate-types", page, perPage, search] as const,
  adminCertifications: (page: number, perPage: number) =>
    ["admin-certifications", page, perPage] as const,
  buyerDashboard: () => ["buyer-dashboard"] as const,
  buyerActivity: (limit: number) => ["buyer-activity", limit] as const,
  buyerRfqs: () => ["buyer-rfqs"] as const,
  buyerOrders: (search: string, statusFilter: string) =>
    ["buyer-orders", search, statusFilter] as const,
  buyerOrderStats: () => ["buyer-order-stats"] as const,
  buyerRfqDetail: (rfqId: string | number) => ["buyer-rfq-detail", rfqId] as const,
  buyerOrderDetail: (orderId: string) => ["buyer-order-detail", orderId] as const,
  adminOrderDetail: (orderId: string) => ["admin-order-detail", orderId] as const,
  manufacturerDashboard: () => ["manufacturer-dashboard"] as const,
  manufacturerRfqs: () => ["manufacturer-rfqs"] as const,
  manufacturerOrders: (search: string, statusFilter: string) =>
    ["manufacturer-orders", search, statusFilter] as const,
  manufacturerOrderStats: () => ["manufacturer-order-stats"] as const,
  manufacturerRfqDetail: (rfqId: string | number) => ["manufacturer-rfq-detail", rfqId] as const,
  manufacturerOrderDetail: (orderId: string) => ["manufacturer-order-detail", orderId] as const,
  manufacturerProducts: (page: number, search: string, statusFilter: string) =>
    ["manufacturer-products", page, search, statusFilter] as const,
  manufacturerProductStats: () => ["manufacturer-product-stats"] as const,
  manufacturerProductDetail: (slug: string) => ["manufacturer-product-detail", slug] as const,
  manufacturerCertifications: (page: number) => ["manufacturer-certifications", page] as const,
  manufacturerAnalyticsMetrics: (period: string) => ["manufacturer-analytics-metrics", period] as const,
  manufacturerAnalyticsPerformance: (period: string) =>
    ["manufacturer-analytics-performance", period] as const,
  manufacturerAnalyticsFunnel: (period: string) => ["manufacturer-analytics-funnel", period] as const,
  manufacturerReviewCenter: () => ["manufacturer-review-center"] as const,
  publicCategories: (perPage: number) => ["public-categories", perPage] as const,
  publicAllCategories: () => ["public-all-categories"] as const,
  publicHomeFeaturedProducts: () => ["public-home-featured-products"] as const,
  publicHomeFeaturedSuppliers: () => ["public-home-featured-suppliers"] as const,
  publicFaqCategories: () => ["public-faq-categories"] as const,
  publicSearchProducts: (query: string) => ["public-search-products", query] as const,
  publicSearchSuppliers: (query: string) => ["public-search-suppliers", query] as const,
  publicProducts: (
    page: number,
    search: string,
    category: string,
    sortBy: string,
    country: string,
    moq: string,
    certs: string,
    markets: string,
    categoriesReady: number
  ) =>
    [
      "public-products",
      page,
      search,
      category,
      sortBy,
      country,
      moq,
      certs,
      markets,
      categoriesReady,
    ] as const,
  publicSuppliersFilterSource: () => ["public-suppliers-filter-source"] as const,
  publicSuppliersFilterOptions: () => ["public-suppliers-filter-options"] as const,
  publicSuppliers: (
    page: number,
    search: string,
    industry: string,
    certification: string,
    moq: string,
    country: string | null
  ) => ["public-suppliers", page, search, industry, certification, moq, country] as const,
  publicIndustriesList: (page: number) => ["public-industries-list", page] as const,
  publicIndustriesStats: () => ["public-industries-stats"] as const,
  publicProductDetail: (slug: string) => ["public-product-detail", slug] as const,
  publicBlogArticles: () => ["public-blog-articles"] as const,
  publicBlogArticle: (slug: string) => ["public-blog-article", slug] as const,
}

/** Partial keys for `invalidateQueries` when filters/pagination vary */
export const queryKeyFamilies = {
  adminProducts: ["admin-products"] as const,
  adminOrders: ["admin-orders"] as const,
  buyerOrders: ["buyer-orders"] as const,
  manufacturerOrders: ["manufacturer-orders"] as const,
  manufacturerProducts: ["manufacturer-products"] as const,
  manufacturerCertifications: ["manufacturer-certifications"] as const,
  publicProducts: ["public-products"] as const,
  publicSuppliers: ["public-suppliers"] as const,
} as const
