import type { TranslationKeys } from "../en";

const buyerHe = {
  layout: {
    loading: "טוען...",
    buyer: "קונה",
    yourCompany: "החברה שלך",
    submitRfq: "שלח בקשה חדשה להצעת מחיר",
    help: "עזרה",
    browseSuppliers: "גלוש בין הספקים",
    searchPlaceholder: "חפש ספקים, מוצרים...",
    viewWebsite: "הצג אתר",
    logOut: "התנתק",
    nav: {
      overview: "סקירה כללית",
      myRfqs: "הצעות המחיר שלי",
      savedSuppliers: "ספקים שמורים",
      orders: "הזמנות",
      messages: "הודעות",
      supportTickets: "פניות תמיכה",
      recentActivity: "פעילות אחרונה",
      settings: "הגדרות"
    }
  },
  dashboard: {
    welcome: "ברוך שובך, {name}",
    subtitle: "הנה מה שקורה עם פעילויות הרכש שלך.",
    failedToLoad: "טעינת נתוני לוח הבקרה נכשלה.",
    stats: {
      activeConversations: "שיחות פעילות",
      rfqsSubmitted: "הצעות מחיר שנשלחו",
      savedSuppliers: "ספקים שמורים",
      productsViewed: "מוצרים שנצפו"
    },
    recentMessages: {
      title: "הודעות אחרונות",
      viewAll: "הצג הכל",
      noMessages: "אין הודעות אחרונות."
    },
    quickActions: {
      title: "פעולות מהירות",
      findSuppliers: "חפש ספקים",
      browseProducts: "גלוש במוצרים",
      submitRfq: "שלח בקשה להצעת מחיר"
    },
    rfqStatus: {
      title: "סטטוס הצעת מחיר",
      viewAll: "הצג הכל",
      rfqId: "מזהה בקשה",
      product: "מוצר",
      supplier: "ספק",
      status: "סטטוס",
      date: "תאריך",
      noRfqs: "אין בקשות להצעות מחיר אחרונות."
    },
    recommended: {
      title: "מומלץ עבורך",
      exploreAll: "חקור הכל",
      products: "{count} מוצרים",
      noSuppliers: "אין ספקים מומלצים כרגע."
    },
    recentActivity: {
      title: "פעילות אחרונה",
      viewAll: "הצג הכל",
      noActivity: "אין פעילות אחרונה."
    }
  },
  rfqs: {
    title: "בקשות להצעות מחיר",
    subtitle: "נהל ועקוב אחר בקשות הצעת המחיר שלך",
    newRfq: "בקשה חדשה להצעת מחיר",
    stats: {
      total: "סה\"כ הצעות מחיר",
      quoted: "הוצע מחיר",
      pending: "בהמתנה",
      inReview: "בבדיקה"
    },
    searchPlaceholder: "חפש לפי מוצר, ספק, או מזהה בקשה...",
    allStatus: "כל הסטטוסים",
    table: {
      rfqId: "מזהה בקשה",
      product: "מוצר",
      supplier: "ספק",
      quantity: "כמות",
      status: "סטטוס",
      quote: "הצעת מחיר",
      date: "תאריך",
      actions: "פעולות",
      unknown: "לא ידוע",
      noSupplier: "אין ספק"
    },
    status: {
      quoted: "הוצע מחיר",
      pending: "בהמתנה",
      inReview: "בבדיקה",
      expired: "פג תוקף",
      accepted: "התקבל",
      rejected: "נדחה"
    },
    empty: {
      title: "לא נמצאו בקשות להצעות מחיר",
      adjustFilters: "נסה להתאים את המסננים שלך",
      getStarted: "שלח את הבקשה הראשונה שלך כדי להתחיל",
      submitRfq: "שלח בקשה להצעת מחיר"
    },
    details: {
      notFound: "בקשת הצעת מחיר לא נמצאה",
      notFoundDesc: "בקשת הצעת המחיר שאתה מחפש אינה קיימת או שהוסרה.",
      backToRfqs: "חזרה לבקשות להצעת מחיר",
      submittedOn: "נשלח ב-{date}",
      yourRequest: "הבקשה שלך",
      fields: {
        product: "מוצר",
        quantity: "כמות",
        targetPrice: "מחיר יעד",
        delivery: "מסירה",
        packagingDetails: "פרטי אריזה",
        additionalRequirements: "דרישות נוספות"
      },
      na: "לא רלוונטי",
      supplierOffer: "הצעת ספק",
      quoteValidity: "תוקף ההצעה: {days} ימים",
      acceptQuote: "קבל הצעה",
      declineQuote: "דחה הצעה",
      messageSupplier: "שלח הודעה לספק",
      pricingDetails: "פרטי תמחור",
      unitPrice: "מחיר יחידה",
      totalPrice: "מחיר כולל",
      shippingAndTerms: "משלוח ותנאים",
      shippingMethod: "שיטת משלוח",
      incoterms: "תנאי סחר בינלאומיים (Incoterms)",
      leadTime: "זמן אספקה",
      leadTimeDays: "{days} ימים",
      paymentTerms: "תנאי תשלום",
      notesFromSupplier: "הערות מהספק",
      includedDocuments: "מסמכים מצורפים",
      download: "הורד",
      waitingForQuote: "ממתין להצעת ספק",
      waitingForQuoteDesc: "הבקשה שלך נשלחה לספק. תקבל התראה כאשר יענו עם הצעת מחיר.",
      alerts: {
        success: "הצלחה!",
        acceptSuccess: "ההצעה התקבלה בהצלחה.",
        declineSuccess: "ההצעה נדחתה בהצלחה.",
        error: "שגיאה",
        acceptError: "קבלת ההצעה נכשלה.",
        declineError: "דחיית ההצעה נכשלה.",
        unexpectedError: "אירעה שגיאה בלתי צפויה."
      }
    }
  },
  activity: {
    title: "פעילות אחרונה",
    subtitle: "עקוב אחר האינטראקציות שלך עם ספקים ומוצרים",
    labels: {
      message: "הודעה",
      rfq_response: "הצעת מחיר",
      rfq_sent: "בקשה להצעת מחיר",
      view: "נצפה",
      save: "נשמר",
      account: "חשבון"
    },
    stats: {
      suppliersContacted: "ספקים שיצרת איתם קשר",
      rfqsSubmitted: "בקשות הצעות מחיר שנשלחו",
      suppliersSaved: "ספקים שנשמרו"
    }
  },
  orders: {
    title: "ההזמנות שלי",
    subtitle: "עקוב ונהל את הרכישות שלך",
    searchPlaceholder: "חפש לפי מספר הזמנה או מוצר...",
    allStatus: "כל הסטטוסים",
    empty: {
      title: "לא נמצאו הזמנות",
      desc: "נסה להתאים את המסננים שלך"
    },
    details: {
      backToOrders: "חזרה להזמנות",
      invalidId: "מזהה הזמנה לא חוקי",
      notFound: "הזמנה לא נמצאה",
      failedToLoad: "טעינת פרטי ההזמנה נכשלה",
      orderPlaced: "ההזמנה בוצעה",
      amount: "סכום",
      manufacturer: "יצרן",
      shippingAddress: "כתובת למשלוח",
      orderDetails: "פרטי הזמנה",
      productName: "שם המוצר",
      quantity: "כמות",
      unitPrice: "מחיר יחידה",
      totalAmount: "סכום כולל",
      paymentStatus: "סטטוס תשלום",
      paymentMethod: "שיטת תשלום",
      shippingDetails: "פרטי משלוח",
      carrier: "חברת משלוחים",
      trackingNumber: "מספר מעקב",
      estimatedDelivery: "משלוח משוער",
      shippingNotes: "הערות משלוח",
      documents: "מסמכים",
      noDocuments: "אין מסמכים זמינים",
      statusUpdates: "עדכוני סטטוס",
      download: "הורד",
      noUpdates: "אין עדכוני סטטוס זמינים."
    }
  },
  messages: {
    title: "הודעות",
    subtitle: "תקשר עם ספקים",
    searchPlaceholder: "חפש הודעות...",
    empty: {
      title: "אין הודעות עדיין",
      desc: "התחל שיחה עם ספק"
    }
  },
  saved: {
    title: "ספקים שמורים",
    subtitle: "נהל את הספקים המועדפים עליך",
    productsTab: "מוצרים שמורים",
    suppliersTab: "ספקים שמורים",
    searchPlaceholder: "חפש ספקים שמורים...",
    empty: {
      title: "אין ספקים שמורים",
      desc: "גלוש בין ספקים ושמור אותם כאן"
    }
  },
  settings: {
    title: "הגדרות חשבון",
    subtitle: "נהל את הפרופיל, ההעדפות והאבטחה שלך",
    profile: "פרטי פרופיל",
    saveChanges: "שמור שינויים",
    saved: "ההגדרות נשמרו בהצלחה",
    failed: "שמירת ההגדרות נכשלה",
    language: "העדפות שפה",
    security: "אבטחה",
    notifications: "התראות"
  },
  supportTickets: {
    title: "פניות תמיכה",
    subtitle: "נהל את בקשות התמיכה והפניות שלך",
    newTicket: "פנייה חדשה",
    searchPlaceholder: "חפש פניות...",
    allStatus: "כל הסטטוסים",
    empty: {
      title: "לא נמצאו פניות",
      desc: "צריך עזרה? צור פניית תמיכה חדשה."
    }
  }
} as const;

export default buyerHe;
