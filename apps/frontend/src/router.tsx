import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout";
import { getBasePath } from "./utils/zma";
import HomePage from "./pages/home";
import OrderPage from "./pages/order";
import ProfilePage from "./pages/profile";
import SearchPage from "./pages/search";
import CheckoutPage from "./pages/checkout";
import SelectLocationPage from "./pages/select-location";
import OrderSuccessPage from "./pages/order-success";
import OrderDetailPage from "./pages/order-detail";
import { copy } from "@/constants/copy";

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
          element: <OrderPage />,
          handle: {
            hideCart: true,
            hideHeader: true,
          },
        },
        {
          path: "/profile",
          element: <ProfilePage />,
          handle: {
            hideCart: true,
            hideHeader: true,
          },
        },
        { path: "/menu/search", element: <SearchPage /> },
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
            whiteBackground: true,
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
            whiteBackground: true,
            hideFooter: true,
          },
        },
        {
          path: "/order/:orderId",
          element: <OrderDetailPage />,
          handle: {
            title: "Chi tiết đơn hàng",
            back: true,
            whiteBackground: true,
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
