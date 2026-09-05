import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Tọa độ trung tâm TP. Hồ Chí Minh mặc định nếu chưa có GPS
const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009];

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChangeLocation: (lat: number, lng: number) => void;
  isLocating?: boolean;
  onLocateCurrent?: () => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  onChangeLocation,
  isLocating = false,
  onLocateCurrent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const isUserDraggingRef = useRef<boolean>(false);
  const lastReportedPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat =
      latitude && latitude !== 0 ? latitude : DEFAULT_CENTER[0];
    const initialLng =
      longitude && longitude !== 0 ? longitude : DEFAULT_CENTER[1];

    lastReportedPosRef.current = { lat: initialLat, lng: initialLng };

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // TileLayer CartoDB Voyager mượt mà, dễ nhìn địa chỉ tại Việt Nam
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        subdomains: "abcd",
      },
    ).addTo(map);

    map.on("movestart", () => {
      isUserDraggingRef.current = true;
      setIsMoving(true);
    });

    map.on("moveend", () => {
      setIsMoving(false);
      const center = map.getCenter();
      const last = lastReportedPosRef.current;

      // Chỉ kích hoạt callback nếu dịch chuyển trên 25 mét so với vị trí đã gọi trước đó
      if (!last || map.distance(center, [last.lat, last.lng]) > 25) {
        lastReportedPosRef.current = { lat: center.lat, lng: center.lng };
        onChangeLocation(center.lat, center.lng);
      }

      // Đợi micro-task trước khi nhả cờ dragging để tránh xung đột với prop update
      setTimeout(() => {
        isUserDraggingRef.current = false;
      }, 50);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Đồng bộ vị trí bản đồ khi tọa độ thay đổi từ bên ngoài (bấm GPS hoặc chọn từ tìm kiếm)
  useEffect(() => {
    if (!mapRef.current) return;
    if (isUserDraggingRef.current) return;

    if (latitude && longitude && latitude !== 0 && longitude !== 0) {
      lastReportedPosRef.current = { lat: latitude, lng: longitude };
      const currentCenter = mapRef.current.getCenter();
      const distance = mapRef.current.distance(currentCenter, [
        latitude,
        longitude,
      ]);

      // Chỉ bay tới nếu độ lệch lớn hơn 15 mét
      if (distance > 15) {
        mapRef.current.flyTo([latitude, longitude], 17, {
          duration: 0.8,
        });
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="shadow-xs relative z-0 h-[220px] w-full overflow-hidden rounded-2xl border border-black/[0.08] bg-neutral-100">
      {/* Container Leaflet */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Center Pin ghim cố định ở chính giữa tâm bản đồ */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 z-[400] flex -translate-x-1/2 flex-col items-center transition-all duration-200 ease-out ${
          isMoving
            ? "-translate-y-[120%] scale-110"
            : "-translate-y-full scale-100"
        }`}
      >
        <div className="relative flex items-center justify-center">
          <svg
            className="h-9 w-9 text-red-500 drop-shadow-md filter"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
          </svg>
          <div className="shadow-xs absolute top-[8px] h-2.5 w-2.5 rounded-full bg-white" />
        </div>
        {/* Bóng chân ghim */}
        <div
          className={`h-1.5 w-3.5 rounded-full bg-black/25 transition-all duration-200 ${
            isMoving
              ? "mt-2 scale-75 opacity-30"
              : "mt-0.5 scale-100 opacity-60"
          }`}
        />
      </div>

      {/* Floating Tooltip nhắc nhở */}
      <div className="pointer-events-none absolute left-1/2 top-2.5 z-[400] -translate-x-1/2">
        <div className="backdrop-blur-xs shadow-xs rounded-full bg-neutral-900/80 px-2.5 py-1 text-[11px] font-medium tracking-tight text-white">
          {isMoving
            ? "Đang chỉnh vị trí..."
            : "Di chuyển bản đồ để chỉnh vị trí ghim"}
        </div>
      </div>

      {/* Nút bấm Vị trí của tôi (GPS) */}
      {onLocateCurrent && (
        <button
          type="button"
          onClick={onLocateCurrent}
          disabled={isLocating}
          className="backdrop-blur-xs absolute bottom-2.5 right-2.5 z-[400] flex items-center justify-center rounded-xl border border-black/[0.08] bg-white/95 p-2 text-neutral-800 shadow-md transition-all hover:bg-white active:scale-95 disabled:opacity-50"
          title="Vị trí hiện tại"
          aria-label="Vị trí hiện tại"
        >
          {isLocating ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <svg
              className="h-5 w-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};
