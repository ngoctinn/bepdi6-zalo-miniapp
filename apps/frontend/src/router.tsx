import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout";
import { getBasePath } from "./utils/zma";
import RouteErrorBoundary from "./components/common/route-error-boundary";
import { RouteLoadingFallback } from "./components/common/route-loading-fallback";
import { StaffRouteGuard } from "./components/staff/staff-route-guard";
import { AdminRouteGuard } from "./components/admin/admin-route-guard";
import HomePage from "./pages/home";

const OrderPage = lazy(() => import("./pages/order"));
const CheckoutPage = lazy(() => import("./pages/checkout"));
const SelectLocationPage = lazy(() => import("./pages/select-location"));
const OrderSuccessPage = lazy(() => import("./pages/order-success"));
const OrderDetailPage = lazy(() => import("./pages/order-detail"));
const StaffOrdersPage = lazy(() => import("./pages/staff-orders"));
const ProductDetailPage = lazy(() => import("./pages/product-detail"));

// Lazy-loaded Admin pages
const AdminDashboardPage = lazy(() => import("./pages/admin/dashboard"));
const AdminKitchenPage = lazy(() => import("./pages/admin/kitchen"));
const AdminManageHubPage = lazy(() => import("./pages/admin/manage"));
const AdminCategoryPage = lazy(() => import("./pages/admin/manage/menu"));
const AdminProductPage = lazy(
  () => import("./pages/admin/manage/menu/products"),
);
const AdminVoucherPage = lazy(() => import("./pages/admin/manage/vouchers"));
const AdminCustomerPage = lazy(() => import("./pages/admin/manage/customers"));
const AdminSettingsPage = lazy(() => import("./pages/admin/settings"));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: "/",
          element: <HomePage />,
          handle: { hideHeader: true },
        },
        {
          path: "/menu",
          element: <HomePage />,
          handle: { hideHeader: true },
        },
        {
          path: "/order",
          element: withSuspense(OrderPage),
          handle: {
            hideHeader: true,
            hideCart: true,
          },
        },
        {
          path: "/checkout",
          element: withSuspense(CheckoutPage),
          handle: {
            title: "Xác nhận đơn hàng",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
          },
        },
        {
          path: "/select-location",
          element: withSuspense(SelectLocationPage),
          handle: {
            title: "Địa chỉ nhận hàng",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
          },
        },
        {
          path: "/order-success",
          element: withSuspense(OrderSuccessPage),
          handle: {
            title: "Đặt hàng thành công",
            back: false,
            hideFooter: true,
          },
        },
        {
          path: "/order/:orderId",
          element: withSuspense(OrderDetailPage),
          handle: {
            title: "Chi tiết đơn hàng",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
          },
        },
        {
          element: <StaffRouteGuard />,
          children: [
            {
              path: "/staff/orders",
              element: withSuspense(StaffOrdersPage),
              handle: {
                back: false,
                hideFooter: true,
                headerPosition: "sticky",
                hideHeader: true,
              },
            },
          ],
        },
        {
          element: <AdminRouteGuard />,
          children: [
            {
              path: "/admin",
              element: withSuspense(AdminDashboardPage),
              handle: {
                hideHeader: true,
                hideCart: true,
              },
            },
            {
              path: "/admin/kitchen",
              element: withSuspense(AdminKitchenPage),
              handle: {
                back: false,
                hideFooter: false,
                headerPosition: "sticky",
                hideHeader: true,
                hideCart: true,
              },
            },
            {
              path: "/admin/manage",
              element: withSuspense(AdminManageHubPage),
              handle: {
                title: "Trung Tâm Quản Lý",
                back: true,
                hideCart: true,
                headerPosition: "sticky",
              },
            },
            {
              path: "/admin/manage/menu",
              element: withSuspense(AdminCategoryPage),
              handle: {
                title: "Quản Lý Danh Mục",
                back: true,
                hideCart: true,
                headerPosition: "sticky",
              },
            },
            {
              path: "/admin/manage/menu/products",
              element: withSuspense(AdminProductPage),
              handle: {
                title: "Quản Lý Món Ăn",
                back: true,
                hideCart: true,
                headerPosition: "sticky",
              },
            },
            {
              path: "/admin/manage/vouchers",
              element: withSuspense(AdminVoucherPage),
              handle: {
                title: "Quản Lý Voucher",
                back: true,
                hideCart: true,
                headerPosition: "sticky",
              },
            },
            {
              path: "/admin/manage/customers",
              element: withSuspense(AdminCustomerPage),
              handle: {
                title: "Quản Lý Khách Hàng",
                back: true,
                hideCart: true,
                headerPosition: "sticky",
              },
            },
            {
              path: "/admin/settings",
              element: withSuspense(AdminSettingsPage),
              handle: {
                title: "Cài Đặt Quán",
                back: true,
                hideCart: true,
                headerPosition: "sticky",
              },
            },
          ],
        },
        {
          path: "/product/:id",
          element: withSuspense(ProductDetailPage),
          handle: {
            title: "Chi tiết món",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
          },
        },
      ],
    },
  ],
  {
    basename: getBasePath(),
  },
);

export default router;
