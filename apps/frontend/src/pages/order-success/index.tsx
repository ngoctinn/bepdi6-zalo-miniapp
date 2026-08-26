import { useNavigate } from "react-router-dom";
import checkoutSuccessImg from "@/static/checkout-success.png";
import { Button, Text } from "zmp-ui";
import { copy } from "@/constants/copy";

export default function OrderSuccessPage() {
  const navigate = useNavigate();

  const handleViewOrder = () => {
    navigate("/order");
  };

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center bg-background px-6 pb-24 text-center">
      <img
        draggable={false}
        src={checkoutSuccessImg}
        alt={copy.orderSuccess.title}
        className="animate-bounce-subtle mb-4 h-24 w-24 object-contain"
      />
      <h1 className="mb-2 text-xl font-bold tracking-tight text-neutral900">
        {copy.orderSuccess.title}
      </h1>
      <p className="max-w-xs text-sm leading-relaxed text-neutral600">
        {copy.orderSuccess.description}
      </p>

      {/* Action Footer cố định theo Zalo Result Page Standards */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-background/95 p-4 pb-[calc(var(--zaui-safe-area-inset-bottom,16px)+12px)] shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-md gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex-1 rounded-xl border border-black/10 bg-white py-3 text-sm font-semibold text-neutral800 transition-all hover:bg-black/5 active:scale-[0.98]"
          >
            Về trang chủ
          </button>
          <button
            type="button"
            onClick={handleViewOrder}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primaryDark active:scale-[0.98]"
          >
            Xem đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
