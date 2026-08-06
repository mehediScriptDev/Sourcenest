const buyerEn = {
  layout: {
    loading: "Loading...",
    buyer: "Buyer",
    yourCompany: "Your Company",
    submitRfq: "Submit New RFQ",
    help: "Help",
    browseSuppliers: "Browse Suppliers",
    searchPlaceholder: "Search suppliers, products...",
    viewWebsite: "View Website",
    logOut: "Log Out",
    nav: {
      overview: "Overview",
      myRfqs: "My RFQs",
      savedSuppliers: "Saved Suppliers",
      orders: "Orders",
      messages: "Messages",
      supportTickets: "Support Tickets",
      recentActivity: "Recent Activity",
      settings: "Settings"
    }
  },
  dashboard: {
    welcome: "Welcome back, {name}",
    subtitle: "Here's what's happening with your sourcing activities.",
    failedToLoad: "Failed to load dashboard data.",
    stats: {
      activeConversations: "Active Conversations",
      rfqsSubmitted: "RFQs Submitted",
      savedSuppliers: "Saved Suppliers",
      productsViewed: "Products Viewed"
    },
    recentMessages: {
      title: "Recent Messages",
      viewAll: "View all",
      noMessages: "No recent messages."
    },
    quickActions: {
      title: "Quick Actions",
      findSuppliers: "Find Suppliers",
      browseProducts: "Browse Products",
      submitRfq: "Submit RFQ"
    },
    rfqStatus: {
      title: "RFQ Status",
      viewAll: "View all",
      rfqId: "RFQ ID",
      product: "Product",
      supplier: "Supplier",
      status: "Status",
      date: "Date",
      noRfqs: "No recent RFQs."
    },
    recommended: {
      title: "Recommended for You",
      exploreAll: "Explore all",
      products: "{count} products",
      noSuppliers: "No recommended suppliers right now."
    },
    recentActivity: {
      title: "Recent Activity",
      viewAll: "View all",
      noActivity: "No recent activity."
    }
  },
  rfqs: {
    title: "Request for Quotes",
    subtitle: "Manage and track your RFQ submissions",
    newRfq: "New RFQ",
    stats: {
      total: "Total RFQs",
      quoted: "Quoted",
      pending: "Pending",
      inReview: "In Review"
    },
    searchPlaceholder: "Search by product, supplier, or RFQ ID...",
    allStatus: "All Status",
    table: {
      rfqId: "RFQ ID",
      product: "Product",
      supplier: "Supplier",
      quantity: "Quantity",
      status: "Status",
      quote: "Quote",
      date: "Date",
      actions: "Actions",
      unknown: "Unknown",
      noSupplier: "No supplier"
    },
    status: {
      quoted: "Quoted",
      pending: "Pending",
      inReview: "In Review",
      expired: "Expired",
      accepted: "Accepted",
      rejected: "Rejected"
    },
    empty: {
      title: "No RFQs found",
      adjustFilters: "Try adjusting your filters",
      getStarted: "Submit your first RFQ to get started",
      submitRfq: "Submit RFQ"
    },
    details: {
      notFound: "RFQ Not Found",
      notFoundDesc: "The RFQ you are looking for does not exist or has been removed.",
      backToRfqs: "Back to RFQs",
      submittedOn: "Submitted on {date}",
      yourRequest: "Your Request",
      fields: {
        product: "Product",
        quantity: "Quantity",
        targetPrice: "Target Price",
        delivery: "Delivery",
        packagingDetails: "Packaging Details",
        additionalRequirements: "Additional Requirements"
      },
      na: "N/A",
      supplierOffer: "Supplier Offer",
      quoteValidity: "Quote validity: {days} days",
      acceptQuote: "Accept Quote",
      declineQuote: "Decline Quote",
      messageSupplier: "Message Supplier",
      pricingDetails: "Pricing Details",
      unitPrice: "Unit Price",
      totalPrice: "Total Price",
      shippingAndTerms: "Shipping & Terms",
      shippingMethod: "Shipping Method",
      incoterms: "Incoterms",
      leadTime: "Lead Time",
      leadTimeDays: "{days} Days",
      paymentTerms: "Payment Terms",
      notesFromSupplier: "Notes from Supplier",
      includedDocuments: "Included Documents",
      download: "Download",
      waitingForQuote: "Waiting for Supplier Quote",
      waitingForQuoteDesc: "Your RFQ has been sent to the supplier. You will be notified when they respond with a quote.",
      alerts: {
        success: "Success!",
        acceptSuccess: "Quote accepted successfully.",
        declineSuccess: "Quote declined successfully.",
        error: "Error",
        acceptError: "Failed to accept quote.",
        declineError: "Failed to decline quote.",
        unexpectedError: "An unexpected error occurred."
      }
    }
  },
  activity: {
    title: "Recent Activity",
    subtitle: "Track your interactions with suppliers and products",
    labels: {
      message: "Message",
      rfq_response: "Quote",
      rfq_sent: "RFQ",
      view: "Viewed",
      save: "Saved",
      account: "Account"
    },
    stats: {
      suppliersContacted: "Suppliers Contacted",
      rfqsSubmitted: "RFQs Submitted",
      suppliersSaved: "Suppliers Saved"
    }
  },
  orders: {
    title: "My Orders",
    subtitle: "Track and manage your purchases",
    searchPlaceholder: "Search by order number or product...",
    allStatus: "All Status",
    empty: {
      title: "No orders found",
      desc: "Try adjusting your filters"
    },
    details: {
      backToOrders: "Back to Orders",
      invalidId: "Invalid order ID",
      notFound: "Order not found",
      failedToLoad: "Failed to load order details",
      orderPlaced: "Order Placed",
      amount: "Amount",
      manufacturer: "Manufacturer",
      shippingAddress: "Shipping Address",
      orderDetails: "Order Details",
      productName: "Product Name",
      quantity: "Quantity",
      unitPrice: "Unit Price",
      totalAmount: "Total Amount",
      paymentStatus: "Payment Status",
      paymentMethod: "Payment Method",
      shippingDetails: "Shipping Details",
      carrier: "Carrier",
      trackingNumber: "Tracking Number",
      estimatedDelivery: "Estimated Delivery",
      shippingNotes: "Shipping Notes",
      documents: "Documents",
      noDocuments: "No documents available",
      statusUpdates: "Status Updates",
      download: "Download",
      noUpdates: "No status updates available."
    }
  },
  messages: {
    title: "Messages",
    subtitle: "Communicate with suppliers",
    searchPlaceholder: "Search messages...",
    empty: {
      title: "No messages yet",
      desc: "Start a conversation with a supplier"
    }
  },
  saved: {
    title: "Saved Suppliers",
    subtitle: "Manage your favorite and shortlisted suppliers",
    productsTab: "Saved Products",
    suppliersTab: "Saved Suppliers",
    searchPlaceholder: "Search saved suppliers...",
    empty: {
      title: "No saved suppliers",
      desc: "Browse suppliers and save them here"
    }
  },
  settings: {
    title: "Account Settings",
    subtitle: "Manage your profile, preferences, and security",
    profile: "Profile Information",
    saveChanges: "Save Changes",
    saved: "Settings saved successfully",
    failed: "Failed to save settings",
    language: "Language Preferences",
    security: "Security",
    notifications: "Notifications"
  },
  supportTickets: {
    title: "Support Tickets",
    subtitle: "Manage your support requests and inquiries",
    newTicket: "New Ticket",
    searchPlaceholder: "Search tickets...",
    allStatus: "All Status",
    empty: {
      title: "No tickets found",
      desc: "Need help? Create a new support ticket."
    }
  }
};

export default buyerEn;
