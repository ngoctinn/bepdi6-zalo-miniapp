import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Spinner, Text } from "zmp-ui";
import {
  MapPinIcon,
  MapPinIconSolid,
  PlusIcon,
} from "@/components/common/vectors";
import {
  useAddresses,
  useCreateAddress,
  useDecodeLocation,
  useDeleteAddress,
} from "@/services/address/address.queries";
import { Address, CreateAddressRequest } from "@/types/customer.types";
import { useLocationStore } from "@/stores/location.store";
import {
  getZaloLocationCredentials,
  isZaloRuntime,
} from "@/utils/zalo-permissions";
import { Badge } from "@/components/common/badge";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuth } from "@/hooks/use-auth";
import { copy } from "@/constants/copy";

// Tọa độ mặc định 0 để bắt buộc check GPS hợp lệ
const DEFAULT_LATITUDE = 0;
const DEFAULT_LONGITUDE = 0;

export default function SelectLocationPage() {
  const navigate = useNavigate();
  const { showSuccess, showWarning } = useAppToast();
  const { customer, requestPhoneNumber } = useAuth();
  const { data: addresses, isLoading } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const decodeLocationMutation = useDecodeLocation();
  const { selectedAddress, setSelectedAddress } = useLocationStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateAddressRequest>({
    recipient_name: "",
    phone: "",
    address_text: "",
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    is_default: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Tự động điền thông tin người nhận khi mở modal thêm địa chỉ
  useEffect(() => {
    if (isModalOpen) {
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          recipient_name: prev.recipient_name || customer.name || "",
          phone: prev.phone || customer.phone || "",
        }));
      }

      // Tự động lấy số điện thoại và vị trí nếu chưa có
      if (!formData.phone && isZaloRuntime()) {
        requestPhoneNumber()
          .then((phone) => {
            if (phone) {
              setFormData((prev) => ({ ...prev, phone }));
            }
          })
          .catch((err) => console.warn("Lỗi auto fetch phone", err));
      }
      
      if (formData.latitude === 0 && formData.longitude === 0 && !isGettingLocation) {
        handleGetCurrentLocation();
      }
    }
  }, [isModalOpen, customer]);

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddress(addr);
    navigate(-1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteAddressId) return;
    try {
      await deleteAddressMutation.mutateAsync(deleteAddressId);
      setDeleteAddressId(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    setFormError(null);
    try {
      console.log("[SelectLocation] Requesting location...");
      const credentials = isZaloRuntime()
        ? await getZaloLocationCredentials()
        : {
            token: "dev_browser_mock_location_token",
            accessToken: "dev_browser_mock_access_token",
            latitude: null,
            longitude: null,
          };
      
      console.log("[SelectLocation] Got credentials:", credentials);
      let decoded: any = null;

      if (credentials.token) {
        console.log("[SelectLocation] Decoding token server-to-server...");
        // Gửi token kèm access_token lên backend để giải mã Server-to-Server
        decoded = await decodeLocationMutation.mutateAsync({
          token: credentials.token,
          access_token: credentials.accessToken,
        });
        console.log("[SelectLocation] Decoded result:", decoded);
      } else if (credentials.latitude && credentials.longitude) {
        // ZMP SDK trả về tọa độ trực tiếp (không hỗ trợ token API cho version này)
        decoded = {
          latitude: credentials.latitude,
          longitude: credentials.longitude,
          address_text: "",
        };
      }

      if (decoded && decoded.latitude && decoded.longitude) {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(decoded.latitude),
          longitude: Number(decoded.longitude),
          // Chỉ gợi ý address_text nếu form đang trống để tránh đè text người dùng đã gõ
          address_text: prev.address_text.trim()
            ? prev.address_text
            : decoded.address_text || prev.address_text,
        }));
        showSuccess(copy.selectLocation.gpsSuccess);
      } else {
        throw new Error("Không lấy được tọa độ hợp lệ");
      }
    } catch (err) {
      console.error("[SelectLocation] Location error:", err);
      showWarning(copy.selectLocation.gpsDenied);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleCreateAddress = async () => {
    if (!formData.recipient_name.trim()) {
      setFormError(copy.selectLocation.errMissingName);
      return;
    }
    if (!formData.phone.trim()) {
      setFormError(copy.selectLocation.errMissingPhone);
      return;
    }
    if (!formData.address_text.trim()) {
      setFormError(copy.selectLocation.errMissingAddress);
      return;
    }

    setFormError(null);
    try {
      const newAddr = await createAddressMutation.mutateAsync(formData);
      setSelectedAddress(newAddr);
      setIsModalOpen(false);
      navigate(-1);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : copy.selectLocation.errGeneric,
      );
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 pb-28">
      {/* Address List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner />
          <Text size="xSmall" className="mt-2 text-neutral400">
            {copy.common.loading}
          </Text>
        </div>
      ) : addresses && addresses.length > 0 ? (
        addresses.map((addr) => {
          const isSelected = selectedAddress?.id === addr.id;

          return (
            <div
              key={addr.id}
              onClick={() => handleSelectAddress(addr)}
              className={`flex cursor-pointer items-start justify-between rounded-2xl border p-3.5 transition-all ${
                isSelected
                  ? "shadow-xs border-primary bg-primary/10"
                  : "border-black/5 bg-transparent active:bg-black/[0.02]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-primary">
                  <MapPinIconSolid />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral900">
                      {addr.recipient_name}
                    </span>
                    <span className="text-xs font-medium text-neutral500">
                      {addr.phone}
                    </span>
                    {addr.is_default && (
                      <Badge variant="primary" size="small">
                        {copy.selectLocation.defaultBadge}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-neutral600">
                    {addr.address_text}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-xs font-semibold text-red-600 transition-all hover:bg-red-500/20 active:scale-90"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteAddressId(addr.id);
                }}
                aria-label={copy.common.delete}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.03] text-neutral400">
            <MapPinIcon className="h-8 w-8" />
          </div>
          <p className="text-sm font-bold text-neutral800">
            {copy.selectLocation.emptyTitle}
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral400">
            {copy.selectLocation.emptyHint}
          </p>
        </div>
      )}

      {/* Modal Thêm Địa Chỉ Mới (Chuẩn Design System & Tokens) */}
      {isModalOpen && (
        <Modal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mask
          maskClosable
        >
          <div className="flex w-full flex-col overflow-hidden">
            <div className="mb-4 text-center">
              <h3 className="text-base font-bold text-neutral900">
                {copy.selectLocation.modalTitle}
              </h3>
            </div>

            <div className="space-y-3.5">
              {formError && (
                <div className="rounded-xl border border-red-200/60 bg-red-50 p-2.5 text-xs font-medium text-red-600">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral800">
                  {copy.selectLocation.nameLabel}
                </label>
                <input
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipient_name: e.target.value,
                    }))
                  }
                  placeholder={copy.selectLocation.namePlaceholder}
                  className="w-full rounded-xl border border-black/10 bg-black/[0.02] p-2.5 text-xs text-neutral900 placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral800">
                    {copy.selectLocation.phoneLabel}
                  </label>
                  {isZaloRuntime() && (
                    <button
                      type="button"
                      className="text-[10px] font-bold text-primary active:opacity-70"
                      onClick={async () => {
                        try {
                          const phone = await requestPhoneNumber();
                          if (phone) {
                            setFormData((prev) => ({ ...prev, phone }));
                          }
                        } catch (e) {
                          showWarning("Không thể lấy số điện thoại từ Zalo");
                        }
                      }}
                    >
                      Lấy SĐT Zalo
                    </button>
                  )}
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder={copy.selectLocation.phonePlaceholder}
                  className="w-full rounded-xl border border-black/10 bg-black/[0.02] p-2.5 text-xs text-neutral900 placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral800">
                  {copy.selectLocation.addressLabel}
                </label>
                <textarea
                  rows={2}
                  value={formData.address_text}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address_text: e.target.value,
                    }))
                  }
                  placeholder={copy.selectLocation.addressPlaceholder}
                  className="w-full rounded-xl border border-black/10 bg-black/[0.02] p-2.5 text-xs text-neutral900 placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/15 active:scale-[0.98]"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                >
                  <MapPinIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {isGettingLocation
                      ? copy.selectLocation.gettingGpsButton
                      : copy.selectLocation.getGpsButton}
                  </span>
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  className="h-11 flex-1 rounded-xl bg-stone100 text-xs font-semibold text-neutral700 transition-all hover:bg-stone200 active:scale-[0.98]"
                  onClick={() => setIsModalOpen(false)}
                >
                  {copy.selectLocation.cancel}
                </button>
                <Button
                  className="!h-11 flex-1 !rounded-xl !border-0 !bg-primary !text-xs !font-bold !text-white shadow-md transition-all hover:!bg-primaryDark active:scale-[0.98]"
                  onClick={handleCreateAddress}
                  loading={createAddressMutation.isPending}
                >
                  {copy.selectLocation.save}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Bottom Action Bar */}
      <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 px-4 pt-4 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] active:opacity-90"
        >
          <PlusIcon className="h-4 w-4 shrink-0" />
          <span className="leading-none">
            {copy.selectLocation.addNewButton}
          </span>
        </button>
      </div>

      {/* Modal Xác nhận xóa địa chỉ */}
      <ConfirmModal
        visible={Boolean(deleteAddressId)}
        title={copy.selectLocation.deleteConfirmTitle}
        description={copy.selectLocation.deleteConfirmDesc}
        type="danger"
        confirmText={copy.selectLocation.deleteConfirmButton}
        cancelText={copy.selectLocation.keepButton}
        loading={deleteAddressMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteAddressId(null)}
      />
    </div>
  );
}
