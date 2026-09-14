import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout";
import { getBasePath } from "./utils/zma";
import RouteErrorBoundary from "./components/common/route-error-boundary";
import { RouteLoadingFallback } from "./components/common/route-loading-fallback";
import { StaffRouteGuard } from "./components/staff/staff-route-guard";

const HomePage = lazy(() => import("./pages/home"));
const OrderPage = lazy(() => import("./pages/order"));
const CheckoutPage = lazy(() => import("./pages/checkout"));
const SelectLocationPage = lazy(() => import("./pages/select-location"));
const OrderSuccessPage = lazy(() => import("./pages/order-success"));
const OrderDetailPage = lazy(() => import("./pages/order-detail"));
const StaffOrdersPage = lazy(() => import("./pages/staff-orders"));
const ProductDetailPage = lazy(() => import("./pages/product-detail"));

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
          element: withSuspense(HomePage),
          handle: { hideHeader: true },
        },
        {
          path: "/menu",
          element: withSuspense(HomePage),
          handle: { hideHeader: true },
        },
        {
          path: "/order",
          element: withSuspense(OrderPage),
          handle: {
            hideHeader: true,
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
                title: "Bếp & Quản lý đơn",
                back: false,
                hideFooter: false,
                headerPosition: "sticky",
                hideHeader: true,
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
