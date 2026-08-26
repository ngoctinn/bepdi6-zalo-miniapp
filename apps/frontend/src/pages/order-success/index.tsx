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
    <div className="flex h-full flex-col items-center justify-center bg-background px-6">
      <img
        draggable={false}
        src={checkoutSuccessImg}
        alt={copy.orderSuccess.title}
        className="mb-4 h-24 w-24"
      />
      <Text.Title size="small" className="mb-3 text-text-primary">
        {copy.orderSuccess.title}
      </Text.Title>
      <Text size="xSmall" className="max-w-sm text-center text-text-secondary">
        {copy.orderSuccess.description}
      </Text>
      <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-background/95 p-4 shadow-lg backdrop-blur-md">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex-1 rounded-xl border border-black/10 bg-white py-3.5 text-sm font-semibold text-neutral800 transition-all hover:bg-black/5 active:scale-[0.98]"
          >
            Về trang chủ
          </button>
          <button
            type="button"
            onClick={handleViewOrder}
            className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primaryDark active:scale-[0.98]"
          >
            Xem đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
