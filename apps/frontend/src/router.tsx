import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout";
import { getBasePath } from "./utils/zma";
import HomePage from "./pages/home";
import OrderPage from "./pages/order";
import CheckoutPage from "./pages/checkout";
import SelectLocationPage from "./pages/select-location";
import OrderSuccessPage from "./pages/order-success";
import OrderDetailPage from "./pages/order-detail";
import StaffOrdersPage from "./pages/staff-orders";
import RouteErrorBoundary from "./components/common/route-error-boundary";

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
          element: <OrderPage />,
          handle: {
            hideCart: true,
            hideHeader: true,
          },
        },
        {
          path: "/checkout",
          element: <CheckoutPage />,
          handle: {
            title: "Xác nhận đơn hàng",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
          },
        },
        {
          path: "/select-location",
          element: <SelectLocationPage />,
          handle: {
            title: "Địa chỉ nhận hàng",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
          },
        },
        {
          path: "/order-success",
          element: <OrderSuccessPage />,
          handle: {
            title: "Đặt hàng thành công",
            back: false,
            hideFooter: true,
          },
        },
        {
          path: "/order/:orderId",
          element: <OrderDetailPage />,
          handle: {
            title: "Chi tiết đơn hàng",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
            hideCart: true,
          },
        },
        {
          path: "/staff/orders",
          element: <StaffOrdersPage />,
          handle: {
            title: "Bếp & Quản lý đơn",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
            hideCart: true,
            hideHeader: true,
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
