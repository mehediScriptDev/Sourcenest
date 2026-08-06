import type { TranslationKeys } from "../en";

const buyerAr = {
  layout: {
    loading: "جارٍ التحميل...",
    buyer: "مشتري",
    yourCompany: "شركتك",
    submitRfq: "تقديم طلب عرض سعر جديد",
    help: "مساعدة",
    browseSuppliers: "تصفح الموردين",
    searchPlaceholder: "ابحث عن الموردين، المنتجات...",
    viewWebsite: "عرض الموقع",
    logOut: "تسجيل الخروج",
    nav: {
      overview: "نظرة عامة",
      myRfqs: "طلبات عروض الأسعار الخاصة بي",
      savedSuppliers: "الموردون المحفوظون",
      orders: "الطلبات",
      messages: "الرسائل",
      supportTickets: "تذاكر الدعم",
      recentActivity: "النشاط الأخير",
      settings: "الإعدادات"
    }
  },
  dashboard: {
    welcome: "مرحباً بك مجدداً، {name}",
    subtitle: "إليك ما يحدث في أنشطة التوريد الخاصة بك.",
    failedToLoad: "فشل تحميل بيانات لوحة التحكم.",
    stats: {
      activeConversations: "المحادثات النشطة",
      rfqsSubmitted: "طلبات عروض الأسعار المقدمة",
      savedSuppliers: "الموردون المحفوظون",
      productsViewed: "المنتجات التي تم عرضها"
    },
    recentMessages: {
      title: "أحدث الرسائل",
      viewAll: "عرض الكل",
      noMessages: "لا توجد رسائل حديثة."
    },
    quickActions: {
      title: "إجراءات سريعة",
      findSuppliers: "البحث عن موردين",
      browseProducts: "تصفح المنتجات",
      submitRfq: "تقديم طلب عرض سعر"
    },
    rfqStatus: {
      title: "حالة طلب عرض السعر",
      viewAll: "عرض الكل",
      rfqId: "معرف طلب عرض السعر",
      product: "المنتج",
      supplier: "المورد",
      status: "الحالة",
      date: "التاريخ",
      noRfqs: "لا توجد طلبات عروض أسعار حديثة."
    },
    recommended: {
      title: "موصى به لك",
      exploreAll: "استكشاف الكل",
      products: "{count} منتج",
      noSuppliers: "لا يوجد موردون موصى بهم في الوقت الحالي."
    },
    recentActivity: {
      title: "النشاط الأخير",
      viewAll: "عرض الكل",
      noActivity: "لا يوجد نشاط حديث."
    }
  },
  rfqs: {
    title: "طلبات عروض الأسعار",
    subtitle: "إدارة وتتبع طلبات عروض الأسعار المقدمة",
    newRfq: "طلب عرض سعر جديد",
    stats: {
      total: "إجمالي طلبات عروض الأسعار",
      quoted: "تم التسعير",
      pending: "قيد الانتظار",
      inReview: "قيد المراجعة"
    },
    searchPlaceholder: "البحث حسب المنتج، المورد، أو معرف طلب عرض السعر...",
    allStatus: "جميع الحالات",
    table: {
      rfqId: "معرف طلب عرض السعر",
      product: "المنتج",
      supplier: "المورد",
      quantity: "الكمية",
      status: "الحالة",
      quote: "عرض السعر",
      date: "التاريخ",
      actions: "الإجراءات",
      unknown: "غير معروف",
      noSupplier: "لا يوجد مورد"
    },
    status: {
      quoted: "تم التسعير",
      pending: "قيد الانتظار",
      inReview: "قيد المراجعة",
      expired: "منتهي الصلاحية",
      accepted: "مقبول",
      rejected: "مرفوض"
    },
    empty: {
      title: "لم يتم العثور على طلبات عروض أسعار",
      adjustFilters: "حاول تعديل فلاتر البحث الخاصة بك",
      getStarted: "قدم أول طلب عرض سعر للبدء",
      submitRfq: "تقديم طلب عرض سعر"
    },
    details: {
      notFound: "طلب عرض السعر غير موجود",
      notFoundDesc: "طلب عرض السعر الذي تبحث عنه غير موجود أو تمت إزالته.",
      backToRfqs: "العودة إلى طلبات عروض الأسعار",
      submittedOn: "تم التقديم في {date}",
      yourRequest: "طلبك",
      fields: {
        product: "المنتج",
        quantity: "الكمية",
        targetPrice: "السعر المستهدف",
        delivery: "التسليم",
        packagingDetails: "تفاصيل التغليف",
        additionalRequirements: "متطلبات إضافية"
      },
      na: "غير متوفر",
      supplierOffer: "عرض المورد",
      quoteValidity: "صلاحية العرض: {days} يوم",
      acceptQuote: "قبول العرض",
      declineQuote: "رفض العرض",
      messageSupplier: "مراسلة المورد",
      pricingDetails: "تفاصيل التسعير",
      unitPrice: "سعر الوحدة",
      totalPrice: "السعر الإجمالي",
      shippingAndTerms: "الشحن والشروط",
      shippingMethod: "طريقة الشحن",
      incoterms: "شروط التجارة الدولية",
      leadTime: "مهلة التسليم",
      leadTimeDays: "{days} أيام",
      paymentTerms: "شروط الدفع",
      notesFromSupplier: "ملاحظات من المورد",
      includedDocuments: "المستندات المرفقة",
      download: "تنزيل",
      waitingForQuote: "في انتظار عرض سعر المورد",
      waitingForQuoteDesc: "تم إرسال طلب عرض السعر إلى المورد. سيتم إعلامك عندما يردون بعرض سعر.",
      alerts: {
        success: "نجاح!",
        acceptSuccess: "تم قبول العرض بنجاح.",
        declineSuccess: "تم رفض العرض بنجاح.",
        error: "خطأ",
        acceptError: "فشل قبول العرض.",
        declineError: "فشل رفض العرض.",
        unexpectedError: "حدث خطأ غير متوقع."
      }
    }
  },
  activity: {
    title: "النشاط الأخير",
    subtitle: "تتبع تفاعلاتك مع الموردين والمنتجات",
    labels: {
      message: "رسالة",
      rfq_response: "عرض سعر",
      rfq_sent: "طلب عرض سعر",
      view: "شوهد",
      save: "محفوظ",
      account: "الحساب"
    },
    stats: {
      suppliersContacted: "الموردين الذين تم الاتصال بهم",
      rfqsSubmitted: "طلبات عروض الأسعار المقدمة",
      suppliersSaved: "الموردين المحفوظين"
    }
  },
  orders: {
    title: "طلباتي",
    subtitle: "تتبع وإدارة مشترياتك",
    searchPlaceholder: "البحث برقم الطلب أو المنتج...",
    allStatus: "جميع الحالات",
    empty: {
      title: "لا توجد طلبات",
      desc: "حاول تعديل فلاتر البحث الخاصة بك"
    },
    details: {
      backToOrders: "العودة إلى الطلبات",
      invalidId: "رقم الطلب غير صالح",
      notFound: "الطلب غير موجود",
      failedToLoad: "فشل في تحميل تفاصيل الطلب",
      orderPlaced: "تم تقديم الطلب",
      amount: "المبلغ",
      manufacturer: "الشركة المصنعة",
      shippingAddress: "عنوان الشحن",
      orderDetails: "تفاصيل الطلب",
      productName: "اسم المنتج",
      quantity: "الكمية",
      unitPrice: "سعر الوحدة",
      totalAmount: "المبلغ الإجمالي",
      paymentStatus: "حالة الدفع",
      paymentMethod: "طريقة الدفع",
      shippingDetails: "تفاصيل الشحن",
      carrier: "شركة الشحن",
      trackingNumber: "رقم التتبع",
      estimatedDelivery: "التسليم المتوقع",
      shippingNotes: "ملاحظات الشحن",
      documents: "المستندات",
      noDocuments: "لا توجد مستندات متاحة",
      statusUpdates: "تحديثات الحالة",
      download: "تنزيل",
      noUpdates: "لا توجد تحديثات للحالة."
    }
  },
  messages: {
    title: "الرسائل",
    subtitle: "التواصل مع الموردين",
    searchPlaceholder: "البحث في الرسائل...",
    empty: {
      title: "لا توجد رسائل حتى الآن",
      desc: "ابدأ محادثة مع مورد"
    }
  },
  saved: {
    title: "الموردين المحفوظين",
    subtitle: "إدارة مورديك المفضلين والمدرجين في القائمة المختصرة",
    productsTab: "المنتجات المحفوظة",
    suppliersTab: "الموردين المحفوظين",
    searchPlaceholder: "البحث في الموردين المحفوظين...",
    empty: {
      title: "لا يوجد موردين محفوظين",
      desc: "تصفح الموردين واحفظهم هنا"
    }
  },
  settings: {
    title: "إعدادات الحساب",
    subtitle: "إدارة ملفك الشخصي والتفضيلات والأمان",
    profile: "معلومات الملف الشخصي",
    saveChanges: "حفظ التغييرات",
    saved: "تم حفظ الإعدادات بنجاح",
    failed: "فشل في حفظ الإعدادات",
    language: "تفضيلات اللغة",
    security: "الأمان",
    notifications: "الإشعارات"
  },
  supportTickets: {
    title: "تذاكر الدعم",
    subtitle: "إدارة طلبات واستفسارات الدعم الخاصة بك",
    newTicket: "تذكرة جديدة",
    searchPlaceholder: "البحث في التذاكر...",
    allStatus: "جميع الحالات",
    empty: {
      title: "لم يتم العثور على تذاكر",
      desc: "بحاجة للمساعدة؟ قم بإنشاء تذكرة دعم جديدة."
    }
  }
} as const;

export default buyerAr;
