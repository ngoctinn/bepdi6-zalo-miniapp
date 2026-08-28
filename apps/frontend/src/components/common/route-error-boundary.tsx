import React from "react";
import { useRouteError, useNavigate } from "react-router-dom";
import { Button, Text, Icon } from "zmp-ui";

/**
 * RouteErrorBoundary: Xử lý lỗi runtime hoặc lỗi tải module động trên Zalo Mini App
 * Đảm bảo trải nghiệm liền mạch, không hiện màn hình lỗi xám xịt của framework.
 */
export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error("[RouteErrorBoundary caught error]:", error);

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-danger">
        <Icon icon="zi-warning-circle-solid" className="text-3xl text-danger" />
      </div>

      <Text.Title size="small" className="mb-2 font-bold text-neutral900">
        Không thể tải trang
      </Text.Title>

      <p className="mb-6 max-w-xs text-sm leading-relaxed text-neutral600">
        Đã có sự cố trong quá trình tải dữ liệu hoặc kết nối mạng bị gián đoạn.
      </p>

      <div className="flex w-full max-w-xs gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate("/")}
          className="!h-11 flex-1 !rounded-xl !border-0 !bg-stone100 !text-sm !font-semibold !text-neutral700 transition-all hover:!bg-stone200 active:scale-[0.98]"
        >
          Về trang chủ
        </Button>

        <Button
          onClick={() => window.location.reload()}
          className="!h-11 flex-1 !rounded-xl !border-0 !bg-primary !text-sm !font-bold !text-white shadow-md transition-all hover:!bg-primaryDark active:scale-[0.98]"
        >
          Tải lại trang
        </Button>
      </div>
    </div>
  );
}
