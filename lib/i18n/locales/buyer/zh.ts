const buyerZh = {
  layout: {
    loading: "加载中...",
    buyer: "买家",
    yourCompany: "您的公司",
    submitRfq: "提交新询价 (RFQ)",
    help: "帮助",
    browseSuppliers: "浏览供应商",
    searchPlaceholder: "搜索供应商、产品...",
    viewWebsite: "访问网站",
    logOut: "退出登录",
    nav: {
      overview: "概览",
      myRfqs: "我的询价",
      savedSuppliers: "收藏的供应商",
      orders: "订单",
      messages: "消息",
      supportTickets: "工单",
      recentActivity: "近期活动",
      settings: "设置"
    }
  },
  dashboard: {
    welcome: "欢迎回来，{name}",
    subtitle: "这是您的采购活动动态。",
    failedToLoad: "加载仪表板数据失败。",
    stats: {
      activeConversations: "活跃会话",
      rfqsSubmitted: "已提交的询价",
      savedSuppliers: "收藏的供应商",
      productsViewed: "浏览的产品"
    },
    recentMessages: {
      title: "最新消息",
      viewAll: "查看全部",
      noMessages: "暂无最新消息。"
    },
    quickActions: {
      title: "快速操作",
      findSuppliers: "寻找供应商",
      browseProducts: "浏览产品",
      submitRfq: "提交询价"
    },
    rfqStatus: {
      title: "询价状态",
      viewAll: "查看全部",
      rfqId: "询价编号",
      product: "产品",
      supplier: "供应商",
      status: "状态",
      date: "日期",
      noRfqs: "近期没有询价。"
    },
    recommended: {
      title: "为您推荐",
      exploreAll: "探索全部",
      products: "{count} 个产品",
      noSuppliers: "目前没有推荐的供应商。"
    },
    recentActivity: {
      title: "近期动态",
      viewAll: "查看全部",
      noActivity: "暂无近期动态。"
    }
  },
  rfqs: {
    title: "询价单",
    subtitle: "管理和跟踪您的询价单",
    newRfq: "新建询价单",
    stats: {
      total: "总询价单",
      quoted: "已报价",
      pending: "待处理",
      inReview: "审核中"
    },
    searchPlaceholder: "搜索产品、供应商或询价单号...",
    allStatus: "所有状态",
    table: {
      rfqId: "询价单号",
      product: "产品",
      supplier: "供应商",
      quantity: "数量",
      status: "状态",
      quote: "报价",
      date: "日期",
      actions: "操作",
      unknown: "未知",
      noSupplier: "无供应商"
    },
    status: {
      quoted: "已报价",
      pending: "待处理",
      inReview: "审核中",
      expired: "已过期",
      accepted: "已接受",
      rejected: "已拒绝"
    },
    empty: {
      title: "找不到询价单",
      adjustFilters: "尝试调整您的筛选条件",
      getStarted: "提交您的第一个询价单即可开始",
      submitRfq: "提交询价单"
    },
    details: {
      notFound: "找不到询价单",
      notFoundDesc: "您查找的询价单不存在或已被删除。",
      backToRfqs: "返回询价单",
      submittedOn: "提交于 {date}",
      yourRequest: "您的请求",
      fields: {
        product: "产品",
        quantity: "数量",
        targetPrice: "目标价格",
        delivery: "交付日期",
        packagingDetails: "包装详情",
        additionalRequirements: "附加要求"
      },
      na: "不适用",
      supplierOffer: "供应商报价",
      quoteValidity: "报价有效期：{days} 天",
      acceptQuote: "接受报价",
      declineQuote: "拒绝报价",
      messageSupplier: "联系供应商",
      pricingDetails: "价格详情",
      unitPrice: "单价",
      totalPrice: "总价",
      shippingAndTerms: "运输和条款",
      shippingMethod: "运输方式",
      incoterms: "国际贸易术语 (Incoterms)",
      leadTime: "交货时间",
      leadTimeDays: "{days} 天",
      paymentTerms: "付款条件",
      notesFromSupplier: "供应商备注",
      includedDocuments: "包含的文件",
      download: "下载",
      waitingForQuote: "等待供应商报价",
      waitingForQuoteDesc: "您的询价单已发送给供应商。当他们回复报价时，您会收到通知。",
      alerts: {
        success: "成功！",
        acceptSuccess: "报价已成功接受。",
        declineSuccess: "报价已成功拒绝。",
        error: "错误",
        acceptError: "接受报价失败。",
        declineError: "拒绝报价失败。",
        unexpectedError: "发生意外错误。"
      }
    }
  },
  activity: {
    title: "近期活动",
    subtitle: "追踪您与供应商和产品的互动",
    labels: {
      message: "消息",
      rfq_response: "报价",
      rfq_sent: "询价单",
      view: "已查看",
      save: "已收藏",
      account: "账户"
    },
    stats: {
      suppliersContacted: "联系过的供应商",
      rfqsSubmitted: "提交的询价单",
      suppliersSaved: "收藏的供应商"
    }
  },
  orders: {
    title: "我的订单",
    subtitle: "跟踪和管理您的采购",
    searchPlaceholder: "按订单号或产品搜索...",
    allStatus: "所有状态",
    empty: {
      title: "找不到订单",
      desc: "尝试调整您的筛选条件"
    },
    details: {
      backToOrders: "返回订单",
      invalidId: "无效的订单号",
      notFound: "找不到订单",
      failedToLoad: "加载订单详情失败",
      orderPlaced: "订单已提交",
      amount: "金额",
      manufacturer: "制造商",
      shippingAddress: "送货地址",
      orderDetails: "订单详情",
      productName: "产品名称",
      quantity: "数量",
      unitPrice: "单价",
      totalAmount: "总金额",
      paymentStatus: "付款状态",
      paymentMethod: "付款方式",
      shippingDetails: "运输详情",
      carrier: "承运商",
      trackingNumber: "运单号",
      estimatedDelivery: "预计送达",
      shippingNotes: "运输备注",
      documents: "文件",
      noDocuments: "没有可用文件",
      statusUpdates: "状态更新",
      download: "下载",
      noUpdates: "没有可用的状态更新。"
    }
  },
  messages: {
    title: "消息",
    subtitle: "与供应商沟通",
    searchPlaceholder: "搜索消息...",
    empty: {
      title: "暂无消息",
      desc: "开始与供应商交谈"
    }
  },
  saved: {
    title: "收藏的供应商",
    subtitle: "管理您收藏和候选的供应商",
    productsTab: "收藏的产品",
    suppliersTab: "收藏的供应商",
    searchPlaceholder: "搜索收藏的供应商...",
    empty: {
      title: "没有收藏的供应商",
      desc: "浏览供应商并在此处收藏他们"
    }
  },
  settings: {
    title: "账户设置",
    subtitle: "管理您的个人资料、偏好和安全性",
    profile: "个人资料信息",
    saveChanges: "保存更改",
    saved: "设置保存成功",
    failed: "保存设置失败",
    language: "语言偏好",
    security: "安全",
    notifications: "通知"
  },
  supportTickets: {
    title: "工单",
    subtitle: "管理您的技术支持请求和咨询",
    newTicket: "新建工单",
    searchPlaceholder: "搜索工单...",
    allStatus: "所有状态",
    empty: {
      title: "找不到工单",
      desc: "需要帮助？创建一个新的工单。"
    }
  }
};

export default buyerZh;
