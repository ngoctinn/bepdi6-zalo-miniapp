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
      '"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Roboto", "Segoe UI", sans-serif',
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
      home: "Trang chủ",
      menu: "Menu",
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
      paymentMethod: "Phương thức thanh toán",
      orderSummary: "Tóm tắt đơn hàng",
      subtotal: "Tạm tính",
      shippingFee: "Phí vận chuyển",
      discount: "Giảm giá",
      total: "Tổng cộng",
      placeOrder: "Đặt hàng",
      cash: "Tiền mặt",
      card: "Thẻ",
      phoneNumber: "Số điện thoại",
      address: "Địa chỉ",
      note: "Ghi chú",
      processing: "Đang xử lý...",
      delivery: "Giao hàng",
      pickup: "Tự đến lấy",
      pickupLocation: "Địa điểm lấy hàng",
      pickupTime: "Thời gian lấy hàng",
      deliveryTime: "Thời gian nhận hàng",
      chooseStore: "Chọn cửa hàng",
      cartTitle: "Giỏ hàng của tôi",
      addressPlaceholder: "Nhập thông tin địa chỉ cụ thể",
      scheduleSample: "Giao hàng tiêu chuẩn (30-45 phút)",
      paymentMethodCash: "Tiền mặt",
      paymentMethodCard: "Thẻ tín dụng",
      paymentMethodZaloPay: "ZaloPay",
      paymentMethodMomo: "MoMo",
      locationHint: "Địa điểm lấy hàng",
      sampleRecipient: "Khách hàng",
      sampleLocation: "112/3 Bùi Quang Là, Gò Vấp",
      samplePhoneNumber: "0901234567",
      sampleCity: "TP. Hồ Chí Minh",
      createOrderError: "Lỗi tạo đơn hàng",
    },
    order: {
      title: "Đơn hàng",
      status: {
        pending: "Chờ xác nhận",
        confirmed: "Đã xác nhận",
        preparing: "Đang chuẩn bị",
        ready: "Sẵn sàng",
        completed: "Hoàn thành",
        cancelled: "Đã hủy",
      },
      empty: "Chưa có đơn hàng",
      detail: "Chi tiết đơn hàng",
      reorder: "Đặt lại",
      cancelOrder: "Hủy đơn",
      confirmPickup: "Xác nhận đã lấy",
      loading: "Đang tải đơn hàng...",
      emptyHint: "Khi có đơn hàng, nó sẽ xuất hiện ở đây",
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
    },
    profile: {
      title: "Tài khoản",
      personalInfo: "Thông tin cá nhân",
      orders: "Đơn hàng của tôi",
      addresses: "Địa chỉ",
      paymentMethods: "Phương thức thanh toán",
      settings: "Cài đặt",
      logout: "Đăng xuất",
      personalProfile: "Hồ sơ cá nhân",
      vouchers: "Phiếu giảm giá",
      supportCenter: "Trung tâm trợ giúp",
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
      nearestTitle: "Vị trí của bạn",
      notFound: "Không tìm thấy địa điểm",
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
      loading: "Đang tải chi tiết đơn hàng...",
      notFound: "Không tìm thấy đơn hàng",
      backToOrders: "Quay lại danh sách đơn hàng",
    },
    orderSuccess: {
      title: "Đặt hàng thành công!",
      description:
        "Bếp Dì 6 đã tiếp nhận đơn hàng và đang chuẩn bị món ăn thơm ngon cho bạn.",
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
  },
};

// Generic merge - no overwriting, deep merge all nested objects
const themeTokens = deepMerge(base, semantic);

export default themeTokens;
export { base, semantic };
