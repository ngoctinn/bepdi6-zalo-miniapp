// Deep merge utility function
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

const base = {
  fontSize: {
    fs000: "10px",
    fs100: "11px",
    fs200: "12px",
    fs300: "13px",
    fs400: "14px",
    fs500: "15px",
    fs600: "16px",
    fs800: "18px",
    fs1000: "20px",
    fs1400: "24px",
  },
  lineHeight: {
    lh000: "14px",
    lh100: "16px",
    lh200: "16px",
    lh300: "18px",
    lh400: "18px",
    lh500: "20px",
    lh600: "22px",
    lh800: "24px",
    lh1400: "30px",
    lh_full: "1.35",
  },
  letterSpacing: {
    ls000: "0px",
    ls100: "0px",
    ls200: "0px",
    ls300: "0px",
    ls400: "0px",
    ls500: "0px",
    ls600: "0px",
    ls800: "0px",
    ls1400: "0px",
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    black: "900",
  },
  fontFamily: {
    system:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Roboto", "Segoe UI", sans-serif',
  },
  colors: {
    black: "#000000",
    white: "#FFFFFF",

    neutral100: "#F5F5F4",
    neutral200: "#E7E5E4",
    neutral300: "#D6D3D1",
    neutral400: "#A8A29E",
    neutral500: "#78716C",
    neutral600: "#57534E",
    neutral700: "#44403C",
    neutral800: "#292524",
    neutral900: "#0F172A", // Slate 900 cho độ tương phản sắc nét, sạch sẽ

    stone50: "#FAFAF9",
    stone100: "#F5F5F4",
    stone200: "#E7E5E4",
    stone800: "#292524",
    stone900: "#1C1917",

    // Rustic Olive Palette (Xanh rêu mộc mạc - lá chuối hấp miền Tây)
    olive50: "#F7FEE7",
    olive100: "#ECFCCB",
    olive200: "#D9F99D",
    olive600: "#65A30D",
    olive700: "#4D7C0F", // Rustic Olive Brand Primary
    olive800: "#3F6212", // Rustic Olive Brand Pressed
    olive900: "#365314",

    // Warm Ginger & Amber (Vàng mật ong / gừng)
    amber50: "#FFFBEB",
    amber100: "#FEF3C7",
    amber500: "#F59E0B",
    amber600: "#D97706",
    amber700: "#B45309",

    red100: "#FEE2E2",
    red500: "#EF4444",
    red600: "#DC2626", // Chỉ dùng cho Semantic Error / Destructive
    red700: "#B91C1C",

    divider01: "rgba(0, 0, 0, 0.05)",
  },
  opacity: {
    opacity10: "0.1",
  },
  borderWidth: {
    divider01: "0.5px",
  },
  spacing: {
    18: "4.5rem",
    15: "3.75rem",
    66: "16.5rem",
  },
  height: {
    4.5: "18px",
  },
};

const semantic = {
  colors: {
    primary: base.colors.olive700, // #4D7C0F — Xanh rêu mộc mạc (Rustic Olive)
    primaryDark: base.colors.olive800, // #3F6212
    primaryLight: base.colors.olive100, // #ECFCCB
    brandAccent: base.colors.amber600, // #D97706 — Vàng gừng mật ong
    background: base.colors.stone50, // #FAFAF9 — Nền sạch ấm cúng
    surface: "#FFFFFF",
    surfaceSubtle: "rgba(0,0,0,0.02)",
    price: base.colors.neutral900,
    text: {
      primary: base.colors.neutral900,
      secondary: base.colors.neutral600,
      tertiary: base.colors.neutral500,
      disabled: base.colors.neutral400,
      title: base.colors.neutral900, // Tiêu đề quán sạch sẽ, sắc nét
      price: base.colors.neutral900,
    },
    border: {
      primary: "rgba(0, 0, 0, 0.05)",
    },
    icon: {
      tertiary: base.colors.neutral500,
    },
    accent: base.colors.olive700,
    info: base.colors.olive700,
    warning: base.colors.amber600,
    danger: base.colors.red600,
    feedback: {
      success: {
        background: base.colors.olive50, // #F7FEE7
        text: base.colors.olive900, // #365314
        icon: base.colors.olive700, // #4D7C0F
      },
      warning: {
        background: base.colors.amber50, // #FFFBEB
        text: "#78350F", // Amber 900
        icon: base.colors.amber600, // #D97706
      },
      error: {
        background: "#FEF2F2", // Red 50 Soft
        text: "#991B1B", // Red 900
        icon: base.colors.red600, // #DC2626
      },
      info: {
        background: base.colors.stone100, // #F5F5F4
        text: base.colors.stone900, // #1C1917
        icon: base.colors.neutral700, // #44403C
      },
    },
    components: {
      list: {
        title: base.colors.neutral900,
        subtitle: base.colors.neutral500,
      },
      badge: {
        error: {
          solid: {
            backgroundColor: base.colors.red600,
            textOnBackground: base.colors.white,
          },
          outline: {
            backgroundColor: base.colors.red100,
            textOnBackground: base.colors.red600,
          },
        },
        shipping: {
          backgroundColor: base.colors.amber600,
          textOnBackground: base.colors.white,
        },
        new: {
          backgroundColor: base.colors.olive700,
          textOnBackground: base.colors.white,
        },
        discount: {
          backgroundColor: base.colors.red600,
          textOnBackground: base.colors.white,
        },
      },
      sub_cate: {
        border: base.colors.olive100,
      },
      chip: {
        backgroundColor: base.colors.white,
        textOnBackground: base.colors.neutral600,
        border: base.colors.neutral200,
        selected: {
          backgroundColor: base.colors.olive700,
          textOnBackground: base.colors.white,
        },
        feature: {
          unselected: {
            backgroundColor: base.colors.olive50,
            textOnBackground: base.colors.neutral600,
          },
          selected: {
            backgroundColor: base.colors.olive700,
            textOnBackground: base.colors.white,
          },
        },
      },
    },
  },
  backgroundImage: {
    "clean-header":
      "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,249,0.95) 100%)",
  },
  text: {
    common: {
      freeShipping: "Miễn phí giao hàng",
      new: "Mới",
      discount: "Giảm",
      promotion: "Ưu đãi",
      currency: "đ",
      addToCart: "Thêm vào giỏ",
      updateCart: "Cập nhật giỏ hàng",
      order: "Đặt hàng",
      backToHome: "Về trang chủ",
      viewOrder: "Xem đơn hàng",
      cancel: "Hủy",
      confirm: "Xác nhận",
      close: "Đóng",
      edit: "Chỉnh sửa",
      delete: "Xóa",
      search: "Tìm kiếm",
      filter: "Lọc",
      sort: "Sắp xếp",
      all: "Tất cả",
      empty: "Trống",
      loading: "Đang tải...",
      error: "Đã có lỗi xảy ra",
      success: "Thành công",
      networkError: "Vui lòng kiểm tra kết nối mạng",
      addMore: "Thêm nhiều hơn",
      total: "Tổng cộng",
      totalItems: "Tổng mục",
      shippingFee: "Phí giao hàng",
      discountLabel: "Giảm giá",
      paymentSummary: "Tổng hợp thanh toán",
      orderSummary: "Tóm tắt đơn hàng",
      viewDetails: "Chi tiết",
      defaultOption: "Mặc định",
      pickupCode: "Mã lấy hàng",
      resultCountSuffix: "kết quả",
      countOverflow: "99+",
      items: "sản phẩm",
      percentSuffix: "%",
      listSeparator: ", ",
      quantityPrefix: "x",
      buyNow: "Mua ngay",
      notAvailable: "Không khả dụng",
    },
    brand: {
      name: "Bếp Dì 6 - Mắm Chưng Miền Tây",
    },
    nav: {
      home: "Thực đơn",
      menu: "Thực đơn",
      cart: "Giỏ hàng",
      order: "Đơn hàng",
      profile: "Cá nhân",
    },
    header: {
      profile: "Cá nhân",
      delivery: "Giao hàng",
      selectLocation: "Chọn địa điểm",
      confirmation: "Xác nhận",
      productOptions: "Chọn chi tiết",
    },
    home: {
      suggestions: "Gợi ý cho bạn",
      empty: "Chưa có món ăn nào trong thực đơn",
    },
    cart: {
      title: "Giỏ hàng",
      empty: "Giỏ hàng trống",
      emptyHint: "Hãy thêm sản phẩm yêu thích vào giỏ hàng nhé!",
      total: "Tổng cộng",
      checkout: "Thanh toán",
      continue: "Tiếp tục mua sắm",
    },
    checkout: {
      title: "Thanh toán",
      deliveryInfo: "Thông tin giao hàng",
      deliveryAddressSection: "ĐỊA CHỈ GIAO HÀNG",
      pickupStoreSection: "ĐỊA ĐIỂM ĐẾN LẤY MÓN",
      paymentMethod: "Phương thức thanh toán",
      paymentMethodSection: "PHƯƠNG THỨC THANH TOÁN",
      orderSummary: "Tóm tắt đơn hàng",
      orderSummarySection: "MÓN ĐÃ CHỌN",
      paymentDetailSection: "CHI TIẾT THANH TOÁN",
      voucherSection: "MÃ GIẢM GIÁ",
      subtotal: "Tạm tính món ăn",
      shippingFee: "Phí giao hàng",
      freeShipping: "Miễn phí",
      discount: "Giảm giá voucher",
      total: "Tổng thanh toán",
      placeOrder: "Đặt hàng",
      orderSuccess: "Đặt hàng thành công!",
      cash: "Tiền mặt khi nhận hàng (COD)",
      vietqr: "Chuyển khoản VietQR tự động",
      card: "Thẻ",
      phoneNumber: "Số điện thoại *",
      pickupName: "Tên người lấy *",
      pickupPhone: "Số điện thoại *",
      pickupNamePlaceholder: "Tên của bạn",
      pickupPhonePlaceholder: "0901234567",
      address: "Địa chỉ",
      note: "Ghi chú",
      notePlaceholder: "Ghi chú thêm cho shipper hoặc quán...",
      processing: "Đang xử lý tạo đơn...",
      delivery: "Giao tận nơi",
      pickup: "Tự đến lấy",
      pickupLocation: "Địa điểm lấy hàng",
      pickupTime: "Thời gian lấy hàng",
      deliveryTime: "Thời gian nhận hàng",
      deliveryTimeSection: "THỜI GIAN",
      deliveryTimeAsap: "Càng sớm càng tốt",
      deliveryTimeScheduleToday: "Hẹn giờ nhận hôm nay",
      chooseStore: "Chọn cửa hàng",
      cartTitle: "Giỏ hàng của tôi",
      addressPlaceholder: "Nhập thông tin địa chỉ cụ thể",
      selectAddressHint: "Chọn địa chỉ nhận hàng",
      locatingGps: "Đang xác định vị trí giao hàng...",
      currentGpsLocation: "Vị trí hiện tại",
      gpsFailedHint: "Chưa lấy được định vị. Bấm để chọn địa chỉ",
      distanceEstimate: "Cách quán",
      scheduleSample: "Giao hàng tiêu chuẩn (30-45 phút)",
      paymentMethodCash: "Tiền mặt khi nhận hàng (COD)",
      paymentMethodCard: "Thẻ tín dụng",
      paymentMethodZaloPay: "ZaloPay",
      paymentMethodMomo: "MoMo",
      locationHint: "Địa điểm lấy hàng",
      sampleRecipient: "Khách hàng",
      sampleLocation: "112/3 Bùi Quang Là, Gò Vấp",
      samplePhoneNumber: "0901234567",
      sampleCity: "TP. Hồ Chí Minh",
      createOrderError: "Lỗi tạo đơn hàng",
      storeClosed:
        "Quán đang ngưng nhận đơn. Bạn có thể xem thực đơn và quay lại vào giờ mở cửa.",
      storeClosedTitle: "Quán tạm ngưng nhận đơn",
      storeClosedDesc:
        "Hiện tại quán đang tạm thời đóng cửa hoặc ngưng nhận đơn hàng mới. Vui lòng quay lại sau.",
      emptyCartWarning: "Giỏ hàng của bạn đang trống",
      missingAddressWarning: "Vui lòng chọn địa chỉ nhận hàng",
      missingPickupNameWarning: "Vui lòng nhập tên người nhận món tại quán",
      missingPickupPhoneWarning: "Vui lòng nhập số điện thoại người nhận",
      invalidOrderTitle: "Đơn hàng không hợp lệ",
      orderFailedTitle: "Đặt hàng không thành công",
      orderFailedDefaultMsg: "Đã có sự cố khi tạo đơn hàng. Vui lòng thử lại.",
      applyVoucher: "Áp dụng",
      removeVoucher: "Gỡ",
      voucherPlaceholder: "Nhập mã voucher...",
      appliedVoucherPrefix: "Đã áp dụng mã",
      consultTitle: "Cần tư vấn đặt món?",
      consultSub: "Hỗ trợ 24/7",
      callShop: "Gọi quán ngay",
      addItems: "+ Thêm món",
      recommended: "Khuyên dùng",
      deliveryMethod: "Hình thức",
      selfPickupFree: "Tự đến lấy (0đ)",
    },
    order: {
      title: "Đơn Hàng Của Tôi",
      status: {
        pending: "Chờ xác nhận",
        confirmed: "Đã xác nhận",
        preparing: "Đang chuẩn bị",
        ready: "Sẵn sàng",
        delivering: "Đang giao",
        readyForPickup: "Mời đến lấy",
        pickedUp: "Đã nhận món",
        completed: "Hoàn thành",
        cancelled: "Đã hủy",
      },
      orderCodePrefix: "Đơn hàng #",
      empty: "Chưa có đơn hàng nào",
      detail: "Chi tiết đơn hàng",
      reorder: "Đặt lại",
      cancelOrder: "Hủy đơn",
      confirmPickup: "Xác nhận đã lấy",
      loading: "Đang tải danh sách đơn hàng...",
      emptyHint:
        "Bạn chưa có đơn hàng nào trong mục này. Hãy khám phá các món ngon của Bếp Dì 6 nhé!",
      exploreMenu: "Khám phá thực đơn",
      ongoing: "Đang diễn ra",
      completedTab: "Hoàn thành",
    },
    product: {
      detail: "Chi tiết sản phẩm",
      description: "Mô tả",
      price: "Giá",
      quantity: "Số lượng",
      size: "Size",
      options: "Tùy chọn",
      required: "Bắt buộc",
      optional: "Tùy chọn",
      note: "Ghi chú",
      notePlaceholder: "Thêm ghi chú cho món này",
      notFound: "Không tìm thấy sản phẩm",
      loading: "Đang tải...",
      outOfStock: "TẠM HẾT",
    },
    profile: {
      title: "Tài Khoản Của Tôi",
      personalInfo: "Thông tin cá nhân",
      orders: "Đơn hàng của tôi",
      addresses: "Sổ địa chỉ giao hàng",
      paymentMethods: "Phương thức thanh toán",
      settings: "Cài đặt",
      logout: "Đăng xuất",
      personalProfile: "Hồ sơ cá nhân",
      vouchers: "Kho Voucher của tôi",
      supportCenter: "Trung tâm hỗ trợ & CSKH",
      avatarAlt: "Ảnh đại diện của khách hàng",
      sampleName: "Khách hàng Zalo",
      featureDeveloping: "Chức năng đang được phát triển...",
    },
    search: {
      placeholder: "Tìm kiếm món ăn...",
      locationPlaceholder: "Tìm kiếm địa điểm",
      noResults: "Không tìm thấy món ăn nào",
      resultCount: "Tìm thấy {count} món ăn",
    },
    selectLocation: {
      title: "Địa chỉ nhận hàng",
      nearestTitle: "Vị trí của bạn",
      notFound: "Không tìm thấy địa điểm",
      emptyTitle: "Chưa có địa chỉ giao hàng nào",
      emptyHint:
        "Thêm địa chỉ để Bếp Dì 6 tính phí giao hàng và giao tận nơi nhé!",
      addNew: "+ Thêm địa chỉ mới",
      addNewButton: "Thêm địa chỉ mới",
      modalTitle: "Thêm địa chỉ giao hàng",
      nameLabel: "Tên người nhận *",
      namePlaceholder: "VD: Nguyễn Văn A",
      phoneLabel: "Số điện thoại nhận hàng *",
      phonePlaceholder: "VD: 0901234567",
      addressLabel: "Địa chỉ chi tiết (Số nhà, tên đường, phường, quận) *",
      addressPlaceholder: "VD: 123 Lê Lợi, P. Bến Nghé, Quận 1, TP.HCM",
      getGpsButton: "Lấy vị trí GPS hiện tại từ Zalo",
      gettingGpsButton: "Đang lấy vị trí...",
      gpsSuccess: "Đã lấy tọa độ và gợi ý địa chỉ thành công!",
      gpsDenied:
        "Không thể lấy vị trí từ Zalo. Vui lòng tự nhập địa chỉ nhận hàng.",
      cancel: "Hủy",
      save: "Lưu địa chỉ",
      defaultBadge: "Mặc định",
      deleteConfirmTitle: "Xóa địa chỉ này?",
      deleteConfirmDesc:
        "Bạn có chắc chắn muốn xóa địa chỉ giao hàng này không?",
      deleteConfirmButton: "Xóa địa chỉ",
      keepButton: "Giữ lại",
      errMissingName: "Vui lòng nhập tên người nhận",
      errMissingPhone: "Vui lòng nhập số điện thoại",
      errMissingAddress: "Vui lòng nhập địa chỉ chi tiết",
      errGeneric: "Không thể thêm địa chỉ",
    },
    orderDetail: {
      title: "Chi tiết đơn hàng",
      thankYou: "Rất cảm ơn quý khách đã đặt hàng tại Bếp Dì 6",
      id: "Mã đơn hàng",
      date: "Thời gian đặt",
      paymentMethod: "Phương thức thanh toán",
      status: "Trạng thái",
      pickupLocation: "Địa điểm lấy hàng",
      deliveryAddress: "Địa chỉ giao hàng",
      items: "Chi tiết món ăn",
      itemsSection: "CHI TIẾT MÓN ĂN",
      totalSection: "TỔNG CỘNG HÓA ĐƠN",
      timelineSection: "TIẾN TRÌNH ĐƠN HÀNG",
      recipient: "Người nhận",
      directPickupHint: "Nhận trực tiếp tại Bếp Dì 6 (TP. Hồ Chí Minh)",
      scheduledPickupTime: "Giờ hẹn lấy:",
      scheduledDeliveryTime: "Giờ hẹn giao:",
      loading: "Đang tải thông tin đơn hàng...",
      notFound: "Không tìm thấy thông tin đơn hàng",
      viewOrdersList: "Xem danh sách đơn",
      backToOrders: "Quay lại danh sách đơn hàng",
      cancelledNotice: "Đơn hàng đã bị hủy.",
      cancelReasonPrefix: "Lý do:",
      vietqrTitle: "QUÉT MÃ VIETQR ĐỂ THANH TOÁN",
      paidStatus: "Đã thanh toán",
      pendingPayStatus: "Chờ thanh toán",
      bankName: "Techcombank (TCB)",
      bankLabel: "Ngân hàng:",
      accountNumberLabel: "Số tài khoản:",
      accountHolderLabel: "Chủ tài khoản:",
      accountHolderName: "NGUYEN THI TUYET THU",
      amountLabel: "Số tiền:",
      transferContentLabel: "Nội dung CK:",
      copy: "Sao chép",
      autoUpdateNote:
        "* Hệ thống sẽ tự động cập nhật trạng thái ngay sau khi nhận được tiền.",
      paidSuccessMessage:
        "Đơn hàng đã được xác nhận thanh toán thành công. Bếp Dì 6 đang chuẩn bị món cho bạn!",
      cancelButton: "Hủy đơn hàng này",
      cancelModalTitle: "Hủy đơn hàng này?",
      cancelModalDesc:
        "Bạn có chắc chắn muốn hủy đơn hàng không? Thao tác này không thể hoàn tác.",
      cancelConfirmText: "Xác nhận hủy",
      cancelKeepText: "Giữ lại đơn",
      cancelSuccess: "Đã hủy đơn hàng thành công",
      cancelFailed: "Không thể hủy đơn hàng",
      cancelReasonUser: "Khách hàng tự hủy trên ứng dụng",
    },
    orderSuccess: {
      title: "Đặt hàng thành công!",
      description:
        "Bếp Dì 6 đã tiếp nhận đơn hàng và đang chuẩn bị món ăn thơm ngon cho bạn.",
      backToHome: "Về trang chủ",
      viewOrder: "Xem đơn hàng",
    },
  },
  fontSize: {
    header_title: [
      base.fontSize.fs800,
      {
        lineHeight: "24px",
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.bold,
        fontFamily: base.fontFamily.system,
      },
    ],
    "variant-title": [
      base.fontSize.fs600,
      {
        lineHeight: "22px",
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.semibold,
        fontFamily: base.fontFamily.system,
      },
    ],
    xxxxsmall: [
      base.fontSize.fs000,
      {
        lineHeight: base.lineHeight.lh000,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.regular,
        fontFamily: base.fontFamily.system,
      },
    ],
    "xxxxsmall-m": [
      base.fontSize.fs000,
      {
        lineHeight: base.lineHeight.lh000,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    xxxsmall: [
      base.fontSize.fs100,
      {
        lineHeight: base.lineHeight.lh_full,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.regular,
        fontFamily: base.fontFamily.system,
      },
    ],
    "xxxsmall-m": [
      base.fontSize.fs100,
      {
        lineHeight: base.lineHeight.lh100,
        letterSpacing: base.letterSpacing.ls100,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    "xxxsmall-bl": [
      base.fontSize.fs100,
      {
        lineHeight: base.lineHeight.lh_full,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.black,
        fontFamily: base.fontFamily.system,
      },
    ],
    xxsmall: [
      base.fontSize.fs200,
      {
        lineHeight: base.lineHeight.lh_full,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.regular,
        fontFamily: base.fontFamily.system,
      },
    ],
    "xxsmall-m": [
      base.fontSize.fs200,
      {
        lineHeight: base.lineHeight.lh_full,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    xsmall: [
      base.fontSize.fs300,
      {
        lineHeight: base.lineHeight.lh300,
        letterSpacing: base.letterSpacing.ls300,
        fontWeight: base.fontWeight.regular,
        fontFamily: base.fontFamily.system,
      },
    ],
    small: [
      base.fontSize.fs400,
      {
        lineHeight: base.lineHeight.lh_full,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.regular,
        fontFamily: base.fontFamily.system,
      },
    ],
    "small-m": [
      base.fontSize.fs400,
      {
        lineHeight: base.lineHeight.lh_full,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    normal: [
      base.fontSize.fs500,
      {
        lineHeight: base.lineHeight.lh500,
        letterSpacing: base.letterSpacing.ls500,
        fontWeight: base.fontWeight.regular,
        fontFamily: base.fontFamily.system,
      },
    ],
    "normal-sb": [
      base.fontSize.fs500,
      {
        lineHeight: base.lineHeight.lh500,
        letterSpacing: base.letterSpacing.ls500,
        fontWeight: base.fontWeight.semibold,
        fontFamily: base.fontFamily.system,
      },
    ],
    "h-normal": [
      base.fontSize.fs800,
      {
        lineHeight: base.lineHeight.lh800,
        letterSpacing: base.letterSpacing.ls800,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    "normal-m": [
      base.fontSize.fs500,
      {
        lineHeight: base.lineHeight.lh500,
        letterSpacing: base.letterSpacing.ls500,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    large: [
      base.fontSize.fs600,
      {
        lineHeight: base.lineHeight.lh600,
        letterSpacing: base.letterSpacing.ls600,
        fontWeight: base.fontWeight.regular,
        fontFamily: base.fontFamily.system,
      },
    ],
    "large-m": [
      base.fontSize.fs600,
      {
        lineHeight: base.lineHeight.lh600,
        letterSpacing: base.letterSpacing.ls600,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    "large-sb": [
      base.fontSize.fs600,
      {
        lineHeight: base.lineHeight.lh_full,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.semibold,
        fontFamily: base.fontFamily.system,
      },
    ],
    xlarge: [
      base.fontSize.fs800,
      {
        lineHeight: base.lineHeight.lh800,
        letterSpacing: base.letterSpacing.ls800,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    "xlarge-m": [
      base.fontSize.fs800,
      {
        lineHeight: base.lineHeight.lh_full,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    "xlarge-sb": [
      base.fontSize.fs800,
      {
        lineHeight: base.lineHeight.lh_full,
        letterSpacing: base.letterSpacing.ls000,
        fontWeight: base.fontWeight.semibold,
        fontFamily: base.fontFamily.system,
      },
    ],
    xxlarge: [
      base.fontSize.fs1400,
      {
        lineHeight: base.lineHeight.lh1400,
        letterSpacing: base.letterSpacing.ls1400,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
    "xxlarge-m": [
      base.fontSize.fs1400,
      {
        lineHeight: base.lineHeight.lh1400,
        letterSpacing: base.letterSpacing.ls1400,
        fontWeight: base.fontWeight.medium,
        fontFamily: base.fontFamily.system,
      },
    ],
  },
  borderColor: {
    "divider/default": base.colors.divider01,
  },
  borderWidth: {
    "divider/default": base.borderWidth.divider01,
  },
  divide: {
    "divider/default": base.colors.divider01,
  },
  backgroundColor: {
    subtle: base.colors.black,
    elevation: {
      "01": "#FEFCE8",
      "02": "#FAFAF5",
    },
  },
  rounded: {
    corner08: "8px",
    card: "16px",
    button: "12px",
    modal: "20px",
    badge: "9999px",
  },
};

// Generic merge - no overwriting, deep merge all nested objects
const themeTokens = deepMerge(base, semantic);

export default themeTokens;
export { base, semantic };
