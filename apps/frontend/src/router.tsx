import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout";
import { getBasePath } from "./utils/zma";
import HomePage from "./pages/home";

// Code-splitting / Lazy loading non-initial routes per Zalo Mini App Best Practices
const OrderPage = lazy(() => import("./pages/order"));
const ProfilePage = lazy(() => import("./pages/profile"));
const SearchPage = lazy(() => import("./pages/search"));
const CheckoutPage = lazy(() => import("./pages/checkout"));
const SelectLocationPage = lazy(() => import("./pages/select-location"));
const OrderSuccessPage = lazy(() => import("./pages/order-success"));
const OrderDetailPage = lazy(() => import("./pages/order-detail"));

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
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
          element: (
            <Suspense fallback={null}>
              <OrderPage />
            </Suspense>
          ),
          handle: {
            hideCart: true,
            hideHeader: true,
          },
        },
        {
          path: "/profile",
          element: (
            <Suspense fallback={null}>
              <ProfilePage />
            </Suspense>
          ),
          handle: {
            hideCart: true,
            hideHeader: true,
          },
        },
        {
          path: "/menu/search",
          element: (
            <Suspense fallback={null}>
              <SearchPage />
            </Suspense>
          ),
        },
        {
          path: "/checkout",
          element: (
            <Suspense fallback={null}>
              <CheckoutPage />
            </Suspense>
          ),
          handle: {
            title: "Xác nhận đơn hàng",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
          },
        },
        {
          path: "/select-location",
          element: (
            <Suspense fallback={null}>
              <SelectLocationPage />
            </Suspense>
          ),
          handle: {
            title: "Địa chỉ nhận hàng",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
          },
        },
        {
          path: "/order-success",
          element: (
            <Suspense fallback={null}>
              <OrderSuccessPage />
            </Suspense>
          ),
          handle: {
            title: "Đặt hàng thành công",
            back: false,
            hideFooter: true,
          },
        },
        {
          path: "/order/:orderId",
          element: (
            <Suspense fallback={null}>
              <OrderDetailPage />
            </Suspense>
          ),
          handle: {
            title: "Chi tiết đơn hàng",
            back: true,
            hideFooter: true,
            headerPosition: "sticky",
            hideCart: true,
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
