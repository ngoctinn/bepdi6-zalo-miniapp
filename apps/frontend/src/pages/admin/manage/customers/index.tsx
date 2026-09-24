import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminCustomerPlaceholderPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-stone-50 p-6 pb-20 text-center">
      <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl text-primary shadow-inner">
        👥
      </div>
      <h1 className="mt-4 text-lg font-bold text-stone-900">
        Quản Lý Khách Hàng
      </h1>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-500">
        Tính năng theo dõi hồ sơ khách hàng, phân hạng thành viên (VIP) và thống
        kê lịch sử mua sắm đang được phát triển ở phiên bản kế tiếp.
      </p>

      <button
        type="button"
        onClick={() => navigate("/admin/manage")}
        className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md active:scale-95"
      >
        ← Quay lại trung tâm quản lý
      </button>
    </div>
  );
}
