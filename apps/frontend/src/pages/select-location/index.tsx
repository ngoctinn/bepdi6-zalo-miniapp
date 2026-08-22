import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Modal, Spinner, Text } from "zmp-ui";
import {
  BackIcon,
  MapPinIcon,
  MapPinIconSolid,
  PlusIcon,
} from "@/components/common/vectors";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
} from "@/services/address/address.queries";
import { Address, CreateAddressRequest } from "@/types/customer.types";
import { useLocationStore } from "@/stores/location.store";
import { getLocation } from "zmp-sdk/apis";

// Tọa độ mặc định gần quán Bếp Dì 6 (TP.HCM)
const DEFAULT_LATITUDE = 10.762622;
const DEFAULT_LONGITUDE = 106.660172;

export default function SelectLocationPage() {
  const navigate = useNavigate();
  const { data: addresses, isLoading } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const { selectedAddress, setSelectedAddress } = useLocationStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddress(addr);
    navigate(-1);
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const data = await getLocation({});
      if (data && data.latitude && data.longitude) {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
        }));
      }
    } catch {
      // Fallback
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleCreateAddress = async () => {
    if (!formData.recipient_name.trim()) {
      setFormError("Vui lòng nhập tên người nhận");
      return;
    }
    if (!formData.phone.trim()) {
      setFormError("Vui lòng nhập số điện thoại");
      return;
    }
    if (!formData.address_text.trim()) {
      setFormError("Vui lòng nhập địa chỉ chi tiết");
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
        err instanceof Error ? err.message : "Không thể thêm địa chỉ",
      );
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-background">
      {/* Address List */}
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4 pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner />
            <Text size="xSmall" className="mt-2 text-neutral400">
              Đang tải danh sách địa chỉ...
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
                    ? "shadow-xs border-green600 bg-green50/50"
                    : "border-black/5 bg-transparent active:bg-black/[0.02]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-green600">
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
                        <span className="py-0.2 rounded-full border border-green600/30 bg-green50 px-2 text-xxxsmall font-bold text-green800">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-neutral600">
                      {addr.address_text}
                    </div>
                  </div>
                </div>

                <Button
                  size="small"
                  type="neutral"
                  className="rounded-lg bg-transparent p-1 text-xxsmall text-red-500 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
                      deleteAddressMutation.mutate(addr.id);
                    }
                  }}
                >
                  Xóa
                </Button>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPinIcon className="mb-2 h-12 w-12 text-neutral300" />
            <p className="text-sm font-medium text-neutral700">
              Chưa có địa chỉ giao hàng nào
            </p>
            <p className="mt-1 text-xs text-neutral400">
              Thêm địa chỉ để Bếp Dì 6 tính phí giao hàng và giao tận nơi nhé!
            </p>
            <Button
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-green800"
              onClick={() => setIsModalOpen(true)}
            >
              + Thêm địa chỉ mới
            </Button>
          </div>
        )}
      </div>

      {/* Modal Thêm Địa Chỉ Mới */}
      <Modal
        visible={isModalOpen}
        title="Thêm địa chỉ giao hàng"
        onClose={() => setIsModalOpen(false)}
        mask
      >
        <div className="space-y-3 py-2">
          {formError && (
            <div className="rounded-md bg-red-50 p-2 text-xs font-medium text-red-600">
              ⚠️ {formError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral700">
              Tên người nhận *
            </label>
            <Input
              value={formData.recipient_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  recipient_name: e.target.value,
                }))
              }
              placeholder="VD: Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral700">
              Số điện thoại nhận hàng *
            </label>
            <Input
              type="text"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="VD: 0901234567"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral700">
              Địa chỉ chi tiết (Số nhà, tên đường, phường, quận) *
            </label>
            <Input
              value={formData.address_text}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address_text: e.target.value,
                }))
              }
              placeholder="VD: 123 Lê Lợi, P. Bến Nghé, Quận 1, TP.HCM"
            />
          </div>

          <div className="pt-2">
            <Button
              size="small"
              type="neutral"
              className="w-full rounded-lg border border-primary/40 bg-primary/5 py-2 text-xs text-primary hover:bg-green50"
              onClick={handleGetCurrentLocation}
              loading={isGettingLocation}
            >
              📍 Lấy vị trí GPS hiện tại từ Zalo
            </Button>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1 bg-neutral100 text-neutral700"
              type="neutral"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 bg-primary font-semibold text-white hover:bg-green800"
              onClick={handleCreateAddress}
              loading={createAddressMutation.isPending}
            >
              Lưu địa chỉ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-background/95 p-4 shadow-lg backdrop-blur-md">
        <Button
          fullWidth
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm active:opacity-90"
        >
          <PlusIcon className="h-4 w-4" />
          Thêm địa chỉ mới
        </Button>
      </div>
    </div>
  );
}
