import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner, Text } from "zmp-ui";
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
  useReverseGeocode,
  useSearchPlaces,
} from "@/services/address/address.queries";
import {
  Address,
  CreateAddressRequest,
  PlaceSuggestion,
} from "@/types/customer.types";
import { useLocationStore } from "@/stores/location.store";
import { LocationPickerMap } from "@/components/location/location-picker-map";
import {
  getZaloLocationCredentials,
  isZaloRuntime,
} from "@/utils/zalo-permissions";
import { Badge } from "@/components/common/badge";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuth } from "@/hooks/use-auth";
import { copy } from "@/constants/copy";
import { DEV_MOCK_LOCATION_CREDENTIALS } from "@/utils/dev-mock";
import { parseVietnameseAddressInput } from "@/utils/format";

// Tọa độ mặc định 0 để bắt buộc check GPS hợp lệ
const DEFAULT_LATITUDE = 0;
const DEFAULT_LONGITUDE = 0;

export default function SelectLocationPage() {
  const navigate = useNavigate();
  const { showSuccess, showWarning } = useAppToast();
  const { customer, requestPhoneNumber, requestUserInfo } = useAuth();
  const { data: addresses, isLoading } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const decodeLocationMutation = useDecodeLocation();
  const reverseGeocodeMutation = useReverseGeocode();
  const reverseGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const { selectedAddress, setSelectedAddress } = useLocationStore();

  const [isCreating, setIsCreating] = useState(false);
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

  // Two-Tier Address State: Tách biệt Số nhà và Địa chỉ bản đồ
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [houseNumber, setHouseNumber] = useState("");
  const [isEditingStreet, setIsEditingStreet] = useState(false);

  // Smart Query Parser: Tự động bóc tách số nhà khi người dùng gõ tìm kiếm (ví dụ: "45 Đồng Nai")
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      const parsed = parseVietnameseAddressInput(trimmed);

      // Nếu phát hiện tiền tố số nhà trong chuỗi tìm kiếm và ô số nhà hiện tại đang trống
      if (parsed.houseNumber && !houseNumber) {
        setHouseNumber(parsed.houseNumber);
      }

      // Gửi phần tên đường sạch lên API định vị bản đồ
      setDebouncedSearch(parsed.searchQuery || trimmed);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, houseNumber]);

  const { data: searchResults = [], isFetching: isSearching } = useSearchPlaces(
    debouncedSearch,
    formData.latitude || undefined,
    formData.longitude || undefined,
  );

  // Tự động điền thông tin người nhận khi mở form thêm địa chỉ
  useEffect(() => {
    if (isCreating && customer) {
      const validName =
        customer.name && customer.name !== "Khách Zalo" ? customer.name : "";
      setFormData((prev) => ({
        ...prev,
        recipient_name: prev.recipient_name || validName,
        phone: prev.phone || customer.phone || "",
      }));
    }
  }, [isCreating, customer]);

  useEffect(() => {
    return () => {
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
      }
    };
  }, []);

  const handleMapLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    if (reverseGeocodeTimeoutRef.current) {
      clearTimeout(reverseGeocodeTimeoutRef.current);
    }
    // Debounce 800ms để tránh spam request khi rê bản đồ
    reverseGeocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await reverseGeocodeMutation.mutateAsync({
          latitude: lat,
          longitude: lng,
        });
        if (res && res.address_text) {
          setFormData((prev) => ({
            ...prev,
            address_text: res.address_text,
          }));
        }
      } catch (err) {
        console.warn("Reverse geocode failed", err);
      }
    }, 800);
  };

  const handleSelectSuggestion = (item: PlaceSuggestion) => {
    const parsed = parseVietnameseAddressInput(searchQuery);
    if (parsed.houseNumber) {
      setHouseNumber(parsed.houseNumber);
    }

    setFormData((prev) => ({
      ...prev,
      latitude: item.latitude,
      longitude: item.longitude,
      address_text: item.address_text,
    }));
    setSearchQuery(item.name || item.address_text);
    setShowSuggestions(false);
  };

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
      const credentials = isZaloRuntime()
        ? await getZaloLocationCredentials()
        : DEV_MOCK_LOCATION_CREDENTIALS;

      let decoded: any = null;

      if (credentials.token) {
        decoded = await decodeLocationMutation.mutateAsync({
          token: credentials.token,
          access_token: credentials.accessToken,
        });
      } else if (credentials.latitude && credentials.longitude) {
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
          address_text: decoded.address_text || prev.address_text,
        }));
        showSuccess(copy.selectLocation.gpsSuccess);
      } else {
        throw new Error("Không lấy được tọa độ hợp lệ");
      }
    } catch {
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
    if (!houseNumber.trim()) {
      setFormError("Vui lòng nhập số nhà, tên tòa nhà hoặc số phòng");
      return;
    }

    const finalAddress = `${houseNumber.trim()}, ${formData.address_text.trim()}`;

    setFormError(null);
    try {
      const newAddr = await createAddressMutation.mutateAsync({
        ...formData,
        address_text: finalAddress,
      });
      setSelectedAddress(newAddr);
      setIsCreating(false);
      setHouseNumber("");
      setSearchQuery("");
      setShowSuggestions(false);
      setIsEditingStreet(false);
      navigate(-1);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : copy.selectLocation.errGeneric,
      );
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 pb-28">
      {isCreating ? (
        /* Form Thêm Địa Chỉ Trực Tiếp Trên Trang */
        <div className="flex flex-col gap-3">
          <div className="px-1">
            <span className="text-xs font-bold uppercase text-neutral900">
              {copy.selectLocation.modalTitle}
            </span>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200/60 bg-red-50 p-2.5 text-xs font-medium text-red-600">
              <svg
                className="h-4 w-4 shrink-0 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          {/* Tên người nhận */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-neutral800">
                {copy.selectLocation.nameLabel}
              </span>
              {isZaloRuntime() && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary transition-opacity hover:opacity-80"
                  onClick={async () => {
                    try {
                      const name = await requestUserInfo();
                      if (name && name !== "Khách Zalo") {
                        setFormData((prev) => ({
                          ...prev,
                          recipient_name: name,
                        }));
                        showSuccess("Lấy tên từ Zalo thành công!");
                      } else {
                        showWarning("Không lấy được tên từ Zalo");
                      }
                    } catch {
                      showWarning("Không thể lấy thông tin từ Zalo");
                    }
                  }}
                >
                  {copy.selectLocation.getNameZalo}
                </button>
              )}
            </div>
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
              className="shadow-xs w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs text-neutral900 transition-colors placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Số điện thoại người nhận */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-neutral800">
                {copy.selectLocation.phoneLabel}
              </span>
              {isZaloRuntime() && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary transition-opacity hover:opacity-80"
                  onClick={async () => {
                    try {
                      const phone = await requestPhoneNumber();
                      if (phone) {
                        setFormData((prev) => ({ ...prev, phone }));
                        showSuccess("Lấy số điện thoại thành công!");
                      } else {
                        showWarning("Không lấy được số điện thoại từ Zalo");
                      }
                    } catch {
                      showWarning("Không thể lấy số điện thoại");
                    }
                  }}
                >
                  {copy.selectLocation.getPhoneZalo}
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
              className="shadow-xs w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs text-neutral900 transition-colors placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Thanh tìm kiếm địa chỉ thông minh (Address Autocomplete) */}
          <div className="relative flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-neutral800">
                Tìm kiếm địa điểm / địa chỉ
              </span>
            </div>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3 flex items-center text-neutral400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ví dụ: 45 Đồng Nai, hoặc gõ tên đường, chung cư..."
                className="shadow-xs w-full rounded-xl border border-black/[0.08] bg-white py-2.5 pl-9 pr-8 text-xs text-neutral900 placeholder:text-neutral400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              {isSearching && (
                <div className="absolute right-3">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              {!isSearching && searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-2.5 rounded-full p-1 text-neutral400 hover:text-neutral600"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown danh sách gợi ý địa điểm */}
            {showSuggestions &&
              debouncedSearch.length >= 2 &&
              searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-[500] mt-1 max-h-56 overflow-y-auto rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-xl">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSuggestion(item)}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
                    >
                      <div className="mt-0.5 shrink-0 text-primary">
                        <MapPinIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-neutral900">
                          {item.name}
                        </p>
                        <p className="line-clamp-1 text-[11px] text-neutral500">
                          {item.address_text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Bản đồ chọn vị trí trực quan */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-neutral800">
                Vị trí trên bản đồ (Center-Pin)
              </span>
              {formData.latitude !== DEFAULT_LATITUDE && (
                <span className="font-mono text-[10px] text-neutral400">
                  {formData.latitude.toFixed(4)},{" "}
                  {formData.longitude.toFixed(4)}
                </span>
              )}
            </div>
            <LocationPickerMap
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChangeLocation={handleMapLocationChange}
              isLocating={isGettingLocation}
              onLocateCurrent={handleGetCurrentLocation}
            />
          </div>

          {/* Nút Lấy vị trí GPS */}
          <div className="pt-0.5">
            <button
              type="button"
              className="shadow-xs flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-olive50/90 py-2.5 text-xs font-bold text-primary transition-all hover:bg-olive100 active:scale-[0.98]"
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

          {/* Ô 1: Số nhà / Tòa nhà / Số phòng (BẮT BUỘC - TẬP TRUNG NHẬP LIỆU) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1 text-xs font-semibold text-neutral800">
                <svg
                  className="h-3.5 w-3.5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Số nhà, tên tòa nhà, số phòng</span>
                <span className="text-red-500">*</span>
              </span>
            </div>
            <input
              type="text"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder="Ví dụ: 45, hoặc 123/45, P.402 Chung cư Botanica..."
              className="shadow-xs w-full rounded-xl border border-black/[0.08] bg-white p-3 text-xs text-neutral900 transition-colors placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Ô 2: Địa chỉ đường / khu vực định vị (từ bản đồ & GPS) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1 text-xs font-semibold text-neutral800">
                <MapPinIcon className="h-3.5 w-3.5 text-primary" />
                <span>Tên đường, phường, quận (từ bản đồ / GPS)</span>
              </span>
              <div className="flex items-center gap-2">
                {reverseGeocodeMutation.isPending && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                    <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
                    Đang định vị...
                  </span>
                )}
                {formData.address_text && (
                  <button
                    type="button"
                    onClick={() => setIsEditingStreet(!isEditingStreet)}
                    className="text-xxxxsmall font-semibold text-primary underline"
                  >
                    {isEditingStreet ? "Xong" : "Sửa tay"}
                  </button>
                )}
              </div>
            </div>

            {isEditingStreet ? (
              <textarea
                rows={2}
                value={formData.address_text}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address_text: e.target.value,
                  }))
                }
                placeholder="Nhập tên đường, phường, quận..."
                className="shadow-xs w-full rounded-xl border border-black/[0.08] bg-white p-2.5 text-xs text-neutral900 transition-colors placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            ) : (
              <div className="flex items-start gap-2.5 rounded-xl border border-black/[0.08] bg-stone-50/80 p-3">
                <div className="mt-0.5 shrink-0 text-primary">
                  <MapPinIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium leading-relaxed text-neutral800">
                    {formData.address_text || (
                      <span className="italic text-neutral400">
                        Chưa có địa chỉ đường. Hãy kéo bản đồ, chọn gợi ý hoặc
                        bấm "Lấy vị trí GPS".
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ô 3: Live Preview Địa chỉ giao hàng đầy đủ */}
          {formData.address_text && (
            <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-olive50/60 p-3 text-xs text-neutral700">
              <div className="mt-0.5 shrink-0 text-primary">
                <MapPinIconSolid className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <span className="block text-[11px] font-semibold text-primaryDark">
                  Địa chỉ giao hàng đầy đủ (Shipper nhìn thấy):
                </span>
                <p className="mt-0.5 text-xs font-bold leading-relaxed text-neutral900">
                  {houseNumber.trim() ? `${houseNumber.trim()}, ` : ""}
                  {formData.address_text}
                </p>
              </div>
            </div>
          )}

          {/* Nút Hành Động */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              className="h-11 flex-1 rounded-xl bg-stone100 text-xs font-semibold text-neutral700 transition-all hover:bg-stone200 active:scale-[0.98]"
              onClick={() => {
                setIsCreating(false);
                setFormError(null);
                setSearchQuery("");
                setHouseNumber("");
                setShowSuggestions(false);
                setIsEditingStreet(false);
              }}
            >
              {copy.selectLocation.cancel}
            </button>
            <button
              type="button"
              disabled={createAddressMutation.isPending}
              onClick={handleCreateAddress}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white shadow-md transition-all hover:bg-primaryDark active:scale-[0.98] disabled:opacity-50"
            >
              {createAddressMutation.isPending
                ? "Đang lưu..."
                : copy.selectLocation.save}
            </button>
          </div>
        </div>
      ) : (
        /* Address List */
        <div className="flex flex-col gap-3">
          <div className="px-1">
            <span className="text-xs font-bold uppercase text-neutral900">
              {copy.checkout.deliveryAddressSection || "DANH SÁCH ĐỊA CHỈ"}
            </span>
          </div>

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
                  className={`shadow-xs flex cursor-pointer items-start justify-between rounded-2xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-black/[0.06] bg-white active:bg-black/[0.02]"
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
        </div>
      )}

      {/* Bottom Action Bar (chỉ hiện khi đang xem danh sách) */}
      {!isCreating && (
        <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 px-4 pt-4 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] active:opacity-90"
          >
            <PlusIcon className="h-4 w-4 shrink-0" />
            <span className="leading-none">
              {copy.selectLocation.addNewButton}
            </span>
          </button>
        </div>
      )}

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
