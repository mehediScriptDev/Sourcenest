"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type RfqStatus = "pending" | "in_review" | "quoted" | "accepted" | "cancelled" | "expired"

export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  quoted: "Quoted",
  accepted: "Accepted",
  cancelled: "Cancelled",
  expired: "Expired",
}

export type RfqUpdateType = "status_change" | "quote_submitted" | "message" | "file_upload"

export interface RfqUpdate {
  id: string
  type: RfqUpdateType
  status: RfqStatus
  note: string
  files: { id: string; name: string }[]
  createdAt: string
  author: "buyer" | "manufacturer" | "admin"
}

export interface Rfq {
  id: string
  productName: string
  quantity: number
  quantityUnit: string
  targetPrice: number
  targetCurrencyCode: string
  destinationPortCity: string
  destinationCountry: string
  additionalRequirements: string
  packagingDetails: string
  shippingTerms: string
  requiredDeliveryDate: string
  buyerEmail: string
  buyerName: string
  buyerCompany: string
  supplierId?: string
  supplierCompanyName?: string
  quotedPrice?: number
  quoteCurrencyCode?: string
  minimumOrderQuantity?: number
  leadTimeDays?: number
  quoteValidUntil?: string
  manufacturerReply?: string
  status: RfqStatus
  createdAt: string
  updates: RfqUpdate[]
}

const STORAGE_KEY = "sourcenest_rfqs_v2"

const seedRfqs: Rfq[] = [
  {
    id: "RFQ-1041",
    productName: "Premium Ceramic Coffee Mugs — 320ml",
    quantity: 10000,
    quantityUnit: "units",
    targetPrice: 1.50,
    targetCurrencyCode: "USD",
    destinationPortCity: "Los Angeles",
    destinationCountry: "USA",
    additionalRequirements: "Custom 1-color logo print on each mug. Pantone 2935C. Need samples first.",
    packagingDetails: "Individual white gift box, 24 units per master carton",
    shippingTerms: "FOB",
    requiredDeliveryDate: "2026-07-15",
    buyerEmail: "buyer@demo.com",
    buyerName: "John Smith",
    buyerCompany: "ABC Imports LLC",
    supplierId: "mfr-1",
    supplierCompanyName: "JingDe Ceramics Co., Ltd.",
    quotedPrice: 1.85,
    quoteCurrencyCode: "USD",
    minimumOrderQuantity: 5000,
    leadTimeDays: 30,
    quoteValidUntil: "2026-06-30",
    manufacturerReply: "We can meet your requirements. The price includes the custom logo print.",
    status: "quoted",
    createdAt: "2026-05-15T09:00:00.000Z",
    updates: [
      {
        id: "u-1",
        type: "status_change",
        status: "pending",
        note: "RFQ submitted to JingDe Ceramics Co., Ltd.",
        files: [{ id: "f-1", name: "logo-design.pdf" }],
        createdAt: "2026-05-15T09:00:00.000Z",
        author: "buyer",
      },
      {
        id: "u-2",
        type: "status_change",
        status: "in_review",
        note: "Manufacturer is reviewing the RFQ requirements.",
        files: [],
        createdAt: "2026-05-16T10:30:00.000Z",
        author: "manufacturer",
      },
      {
        id: "u-3",
        type: "quote_submitted",
        status: "quoted",
        note: "Quote submitted: $1.85/unit. Lead time: 30 days.",
        files: [{ id: "f-2", name: "formal-quote-QT5512.pdf" }],
        createdAt: "2026-05-18T14:00:00.000Z",
        author: "manufacturer",
      },
    ],
  },
  {
    id: "RFQ-1052",
    productName: "Organic Cotton Jersey Fabric",
    quantity: 2000,
    quantityUnit: "meters",
    targetPrice: 4.00,
    targetCurrencyCode: "USD",
    destinationPortCity: "Rotterdam",
    destinationCountry: "Netherlands",
    additionalRequirements: "GOTS certified organic cotton. Navy blue color.",
    packagingDetails: "Rolls wrapped in plastic",
    shippingTerms: "CIF",
    requiredDeliveryDate: "2026-08-01",
    buyerEmail: "buyer@demo.com",
    buyerName: "John Smith",
    buyerCompany: "ABC Imports LLC",
    supplierId: "mfr-2",
    supplierCompanyName: "EcoThread Textiles",
    status: "pending",
    createdAt: "2026-06-05T10:00:00.000Z",
    updates: [
      {
        id: "u-4",
        type: "status_change",
        status: "pending",
        note: "RFQ submitted to EcoThread Textiles.",
        files: [],
        createdAt: "2026-06-05T10:00:00.000Z",
        author: "buyer",
      },
    ],
  },
  {
    id: "1",
    productName: "Toilet Paper - 2 Ply",
    quantity: 50000,
    quantityUnit: "rolls",
    targetPrice: 0.25,
    targetCurrencyCode: "USD",
    destinationPortCity: "New York",
    destinationCountry: "USA",
    additionalRequirements: "Looking for high-quality 2-ply toilet paper for our retail chain. Need FSC certification and custom packaging with our store branding.",
    packagingDetails: "24 rolls per case",
    shippingTerms: "FOB",
    requiredDeliveryDate: "2026-06-15",
    buyerEmail: "buyer@globalretail.com",
    buyerName: "Purchasing Dept",
    buyerCompany: "Global Retail Inc.",
    supplierId: "mfr-1",
    supplierCompanyName: "Your Manufacturing Co.",
    status: "pending",
    createdAt: "2026-03-15T09:00:00.000Z",
    updates: [
      {
        id: "u-inq1",
        type: "status_change",
        status: "pending",
        note: "Inquiry received from Global Retail Inc.",
        files: [],
        createdAt: "2026-03-15T09:00:00.000Z",
        author: "buyer",
      },
    ],
  },
  {
    id: "2",
    productName: "Organic Shampoo - 500ml",
    quantity: 10000,
    quantityUnit: "units",
    targetPrice: 2.50,
    targetCurrencyCode: "EUR",
    destinationPortCity: "Hamburg",
    destinationCountry: "Germany",
    additionalRequirements: "Seeking organic shampoo manufacturer for European market. Must have COSMOS certification and be cruelty-free.",
    packagingDetails: "Recyclable bottles",
    shippingTerms: "CIF",
    requiredDeliveryDate: "2026-07-01",
    buyerEmail: "buyer@ecobeauty.de",
    buyerName: "Sourcing Manager",
    buyerCompany: "EcoBeauty Distributors",
    supplierId: "mfr-1",
    supplierCompanyName: "Your Manufacturing Co.",
    status: "pending",
    createdAt: "2026-03-14T10:00:00.000Z",
    updates: [
      {
        id: "u-inq2",
        type: "status_change",
        status: "pending",
        note: "Inquiry received from EcoBeauty Distributors.",
        files: [],
        createdAt: "2026-03-14T10:00:00.000Z",
        author: "buyer",
      },
    ],
  },
  {
    id: "3",
    productName: "TWS Wireless Earbuds",
    quantity: 5000,
    quantityUnit: "units",
    targetPrice: 12.00,
    targetCurrencyCode: "USD",
    destinationPortCity: "Los Angeles",
    destinationCountry: "USA",
    additionalRequirements: "Interested in TWS earbuds with active noise cancellation for our electronics stores. Bluetooth 5.3, ANC.",
    packagingDetails: "Retail box",
    shippingTerms: "FOB",
    requiredDeliveryDate: "2026-08-15",
    buyerEmail: "purchasing@techmart.com",
    buyerName: "Electronics Buyer",
    buyerCompany: "TechMart USA",
    supplierId: "mfr-1",
    supplierCompanyName: "Your Manufacturing Co.",
    status: "quoted",
    quotedPrice: 14.50,
    quoteCurrencyCode: "USD",
    minimumOrderQuantity: 1000,
    leadTimeDays: 45,
    quoteValidUntil: "2026-05-01",
    manufacturerReply: "We can provide ANC TWS Earbuds with FCC and CE certifications.",
    createdAt: "2026-03-13T11:00:00.000Z",
    updates: [
      {
        id: "u-inq3",
        type: "quote_submitted",
        status: "quoted",
        note: "Quote submitted for TWS Earbuds.",
        files: [],
        createdAt: "2026-03-15T11:00:00.000Z",
        author: "manufacturer",
      },
    ],
  },
  {
    id: "4",
    productName: "LED Smart Bulbs",
    quantity: 20000,
    quantityUnit: "units",
    targetPrice: 4.50,
    targetCurrencyCode: "EUR",
    destinationPortCity: "Berlin",
    destinationCountry: "Germany",
    additionalRequirements: "Looking for smart LED bulbs compatible with major voice assistants. Need CE certification for EU market.",
    packagingDetails: "Standard Retail box",
    shippingTerms: "DDP",
    requiredDeliveryDate: "2026-09-01",
    buyerEmail: "buyer@eurotrade.de",
    buyerName: "Trade Manager",
    buyerCompany: "EuroTrade GmbH",
    supplierId: "mfr-1",
    supplierCompanyName: "Your Manufacturing Co.",
    status: "quoted",
    quotedPrice: 5.20,
    quoteCurrencyCode: "EUR",
    minimumOrderQuantity: 5000,
    leadTimeDays: 30,
    quoteValidUntil: "2026-06-01",
    manufacturerReply: "We have smart bulbs with WiFi + Bluetooth.",
    createdAt: "2026-03-12T14:00:00.000Z",
    updates: [
      {
        id: "u-inq4",
        type: "quote_submitted",
        status: "quoted",
        note: "Quote submitted for Smart Bulbs.",
        files: [],
        createdAt: "2026-03-14T14:00:00.000Z",
        author: "manufacturer",
      },
    ],
  },
  {
    id: "5",
    productName: "Organic Green Tea",
    quantity: 2000,
    quantityUnit: "kg",
    targetPrice: 15.00,
    targetCurrencyCode: "USD",
    destinationPortCity: "Singapore",
    destinationCountry: "Singapore",
    additionalRequirements: "Sourcing premium organic green tea for private label brand. Need USDA and JAS organic certifications.",
    packagingDetails: "Bulk bags",
    shippingTerms: "CIF",
    requiredDeliveryDate: "2026-06-01",
    buyerEmail: "sourcing@asiapacificfoods.sg",
    buyerName: "Food Sourcing",
    buyerCompany: "Asia Pacific Foods",
    supplierId: "mfr-1",
    supplierCompanyName: "Your Manufacturing Co.",
    status: "in_review",
    createdAt: "2026-03-10T16:00:00.000Z",
    updates: [
      {
        id: "u-inq5",
        type: "status_change",
        status: "in_review",
        note: "Reviewing certifications requirements.",
        files: [],
        createdAt: "2026-03-12T16:00:00.000Z",
        author: "manufacturer",
      },
    ],
  }
]

interface CreateRfqInput {
  productName: string
  quantity: number
  quantityUnit: string
  targetPrice: number
  targetCurrencyCode: string
  destinationPortCity: string
  destinationCountry: string
  additionalRequirements: string
  packagingDetails: string
  shippingTerms: string
  requiredDeliveryDate: string
  buyerEmail: string
  buyerName: string
  buyerCompany: string
  supplierId?: string
  supplierCompanyName?: string
}

interface SubmitQuoteInput {
  quotedPrice: number
  quoteCurrencyCode: string
  minimumOrderQuantity: number
  leadTimeDays: number
  quoteValidUntil: string
  manufacturerReply: string
}

interface RfqsContextType {
  rfqs: Rfq[]
  createRfq: (input: CreateRfqInput) => Rfq
  submitQuote: (id: string, input: SubmitQuoteInput) => void
  updateStatus: (id: string, status: RfqStatus, note?: string) => void
  addMessage: (id: string, note: string, author: "buyer" | "manufacturer") => void
  getRfqById: (id: string) => Rfq | undefined
  getRfqsForBuyer: (email: string) => Rfq[]
  getRfqsForManufacturer: (supplierId: string) => Rfq[]
  getRfqsForAdmin: () => Rfq[]
}

const RfqsContext = createContext<RfqsContextType | undefined>(undefined)

export function RfqsProvider({ children }: { children: ReactNode }) {
  const [rfqs, setRfqs] = useState<Rfq[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setRfqs(JSON.parse(stored))
      } catch {
        setRfqs(seedRfqs)
      }
    } else {
      setRfqs(seedRfqs)
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rfqs))
    }
  }, [rfqs, isInitialized])

  const createRfq = (input: CreateRfqInput): Rfq => {
    const now = new Date().toISOString()
    const newRfq: Rfq = {
      ...input,
      id: `RFQ-${Date.now().toString().slice(-4)}`,
      status: "pending",
      createdAt: now,
      updates: [
        {
          id: `u-${Date.now()}`,
          type: "status_change",
          status: "pending",
          note: "RFQ submitted.",
          files: [],
          createdAt: now,
          author: "buyer",
        },
      ],
    }
    setRfqs((prev) => [newRfq, ...prev])
    return newRfq
  }

  const submitQuote = (id: string, input: SubmitQuoteInput) => {
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...input,
              status: "quoted",
              updates: [
                ...r.updates,
                {
                  id: `u-${Date.now()}`,
                  type: "quote_submitted",
                  status: "quoted",
                  note: `Quote submitted: ${input.quoteCurrencyCode} ${input.quotedPrice}. ${input.manufacturerReply}`,
                  files: [],
                  createdAt: new Date().toISOString(),
                  author: "manufacturer",
                },
              ],
            }
          : r
      )
    )
  }

  const updateStatus = (id: string, status: RfqStatus, note?: string) => {
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              updates: [
                ...r.updates,
                {
                  id: `u-${Date.now()}`,
                  type: "status_change",
                  status,
                  note: note || `Status updated to ${status}`,
                  files: [],
                  createdAt: new Date().toISOString(),
                  author: "buyer",
                },
              ],
            }
          : r
      )
    )
  }

  const addMessage = (id: string, note: string, author: "buyer" | "manufacturer") => {
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              updates: [
                ...r.updates,
                {
                  id: `u-${Date.now()}`,
                  type: "message",
                  status: r.status,
                  note,
                  files: [],
                  createdAt: new Date().toISOString(),
                  author,
                },
              ],
            }
          : r
      )
    )
  }

  const getRfqById = (id: string) => rfqs.find((r) => r.id === id)
  const getRfqsForBuyer = (email: string) => rfqs.filter((r) => r.buyerEmail === email)
  const getRfqsForManufacturer = (supplierId: string) => rfqs.filter((r) => r.supplierId === supplierId)
  const getRfqsForAdmin = () => rfqs

  return (
    <RfqsContext.Provider
      value={{
        rfqs,
        createRfq,
        submitQuote,
        updateStatus,
        addMessage,
        getRfqById,
        getRfqsForBuyer,
        getRfqsForManufacturer,
        getRfqsForAdmin,
      }}
    >
      {children}
    </RfqsContext.Provider>
  )
}

export function useRfqs() {
  const context = useContext(RfqsContext)
  if (context === undefined) {
    throw new Error("useRfqs must be used within an RfqsProvider")
  }
  return context
}
