import { Order } from "@/types/order.types";

/**
 * Utility tạo cửa sổ in hóa đơn nhiệt 80mm cho Quán
 * Hỗ trợ in trực tiếp từ trình duyệt Webview hoặc máy in Bluetooth/LAN
 */
export function printOrderReceipt(
  order: Order,
  type: "KITCHEN" | "DELIVERY_BAG" = "DELIVERY_BAG",
) {
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) {
    alert("Vui lòng cho phép trình duyệt mở cửa sổ in (Pop-up).");
    return;
  }

  const isPaid = order.payment?.status === "PAID";
  const itemsHtml = (order.items || [])
    .map(
      (item, idx) => `
      <div style="margin-bottom: 8px; border-bottom: 1px dashed #ddd; padding-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: ${type === "KITCHEN" ? "16px" : "14px"};">
          <span>[ ${item.quantity} ] ${item.product_name}</span>
          ${type === "DELIVERY_BAG" ? `<span>${Number(item.subtotal || 0).toLocaleString("vi-VN")}đ</span>` : ""}
        </div>
        ${
          item.options && item.options.length > 0
            ? `<div style="font-size: 12px; color: #555; margin-left: 12px;">+ ${item.options.map((o) => o.option_name).join(", ")}</div>`
            : ""
        }
        ${
          item.note
            ? `<div style="font-size: 13px; font-weight: bold; color: #b91c1c; margin-top: 4px; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">>>> LƯU Ý: ${item.note}</div>`
            : ""
        }
      </div>
    `,
    )
    .join("");

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>In đơn hàng #${order.order_code}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: monospace, sans-serif; width: 72mm; margin: 0 auto; color: #000; line-height: 1.3; font-size: 13px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px solid #000; margin: 8px 0; }
          .alert-box { border: 2px solid #000; padding: 6px; text-align: center; margin: 8px 0; font-weight: 900; }
          .paid { background: #f0fdf4; }
          .unpaid { background: #fff1f2; }
          .text-lg { font-size: 18px; }
          .text-xl { font-size: 22px; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2 style="margin: 0;">BẾP DÌ 6</h2>
          <p style="margin: 2px 0; font-size: 11px;">Giao hàng món ngon tận nơi</p>
          <div class="double-divider"></div>
          <div class="bold text-xl">ĐƠN #${order.order_code}</div>
          <div style="font-size: 11px;">Giờ đặt: ${new Date(order.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${new Date(order.created_at).toLocaleDateString("vi-VN")}</div>
          <div class="bold" style="margin-top: 4px;">${type === "KITCHEN" ? "** PHIẾU BẾP (CHẾ BIẾN) **" : "** PHIẾU DÁN TÚI GIAO HÀNG **"}</div>
        </div>

        <div class="divider"></div>

        ${
          type === "DELIVERY_BAG"
            ? `
          <div>
            <div><b>Khách:</b> ${order.recipient_name}</div>
            <div><b>SĐT:</b> ${order.phone}</div>
            ${order.delivery_address ? `<div><b>Đ/C:</b> ${order.delivery_address}</div>` : `<div><b>Hình thức:</b> Khách lấy tại quán</div>`}
          </div>
          <div class="divider"></div>
        `
            : ""
        }

        ${
          order.note
            ? `<div class="alert-box" style="border-color: #d97706; background: #fef3c7; color: #78350f; font-size: 12px;">
                GHI CHÚ ĐƠN: ${order.note}
               </div>`
            : ""
        }

        <div style="margin-top: 8px;">
          ${itemsHtml}
        </div>

        ${
          type === "DELIVERY_BAG"
            ? `
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between;">
            <span>Tạm tính:</span>
            <span>${Number(order.subtotal || 0).toLocaleString("vi-VN")}đ</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Phí giao hàng:</span>
            <span>${Number(order.shipping_fee || 0).toLocaleString("vi-VN")}đ</span>
          </div>
          ${
            order.discount > 0
              ? `<div style="display: flex; justify-content: space-between; color: #15803d;">
                  <span>Giảm giá voucher:</span>
                  <span>-${Number(order.discount).toLocaleString("vi-VN")}đ</span>
                </div>`
              : ""
          }
          <div class="double-divider"></div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900;">
            <span>TỔNG TIỀN:</span>
            <span>${Number(order.total_amount || 0).toLocaleString("vi-VN")}đ</span>
          </div>

          <div class="alert-box ${isPaid ? "paid" : "unpaid"}" style="font-size: ${isPaid ? "15px" : "17px"};">
            ${
              isPaid
                ? `[ ĐÃ THANH TOÁN ONLINE ]<br/><span style="font-size: 12px; font-weight: bold;">>>> TUYỆT ĐỐI KHÔNG THU TIỀN <<<</span>`
                : `[ THU TIỀN MẶT COD ]<br/><span style="font-size: 18px; font-weight: 900;">${Number(order.total_amount || 0).toLocaleString("vi-VN")} VNĐ</span>`
            }
          </div>
        `
            : `
          <div class="divider"></div>
          <div class="center bold" style="font-size: 14px;">TỔNG SỐ LƯỢNG MÓN: ${order.items?.reduce((acc, it) => acc + it.quantity, 0) || 0} PHẦN</div>
        `
        }

        <div class="divider"></div>
        <div class="center" style="font-size: 11px; margin-top: 10px;">
          Cảm ơn Quý khách & Chúc ngon miệng!
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
}
