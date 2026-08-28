import React, { useState, useRef, useEffect, useCallback } from "react";
import { TrashIcon } from "./vectors";

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

const ACTION_WIDTH = 76; // Chiều rộng nút xóa (px)
const SWIPE_THRESHOLD = 40; // Ngưỡng để bật mở nút xóa (px)

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onDelete,
  deleteLabel = "Xóa",
  disabled = false,
  className = "",
  contentClassName = "bg-background",
}) => {
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = touch.clientX;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startXRef.current;
    const diffY = touch.clientY - startYRef.current;

    // Xác định hướng vuốt ngay khi bắt đầu di chuyển
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (!isHorizontalSwipe.current) {
      return; // Để người dùng scroll dọc bình thường
    }

    currentXRef.current = touch.clientX;

    // Tính toán độ lệch khi vuốt sang trái
    const baseOffset = isOpen ? -ACTION_WIDTH : 0;
    const nextOffset = baseOffset + diffX;

    // Giới hạn vùng kéo: không cho kéo quá nhiều sang phải (max 0) và giới hạn kéo sang trái (max -ACTION_WIDTH - 20)
    if (nextOffset > 0) {
      setOffsetX(0);
    } else if (nextOffset < -ACTION_WIDTH - 30) {
      setOffsetX(-ACTION_WIDTH - 30);
    } else {
      setOffsetX(nextOffset);
    }
  };

  const handleTouchEnd = () => {
    if (disabled || !isDragging) return;
    setIsDragging(false);

    if (!isHorizontalSwipe.current) {
      return;
    }

    const diffX = currentXRef.current - startXRef.current;

    if (isOpen) {
      // Đang mở, nếu kéo sang phải quá threshold -> Đóng lại
      if (diffX > SWIPE_THRESHOLD) {
        setIsOpen(false);
        setOffsetX(0);
      } else {
        setOffsetX(-ACTION_WIDTH);
      }
    } else {
      // Đang đóng, nếu kéo sang trái quá threshold -> Mở ra
      if (diffX < -SWIPE_THRESHOLD) {
        setIsOpen(true);
        setOffsetX(-ACTION_WIDTH);
      } else {
        setOffsetX(0);
      }
    }
  };

  const closeSwipe = useCallback(() => {
    setIsOpen(false);
    setOffsetX(0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setOffsetX(0);
    }
  }, [isOpen]);

  return (
    <div
      className={`relative select-none overflow-hidden rounded-2xl ${className}`}
    >
      {/* Nút Xóa (Nền đỏ phía dưới) */}
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-center bg-danger text-white transition-opacity ${
          offsetX !== 0 || isOpen || isDragging
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ width: `${ACTION_WIDTH}px` }}
      >
        <button
          type="button"
          onClick={() => {
            closeSwipe();
            onDelete();
          }}
          className="flex h-full w-full flex-col items-center justify-center gap-1 active:opacity-80"
          aria-label={deleteLabel}
        >
          <TrashIcon className="h-5 w-5" />
          <span className="text-xxsmall font-bold leading-none">
            {deleteLabel}
          </span>
        </button>
      </div>

      {/* Nội dung item trượt phía trên */}
      <div
        className={`relative transition-transform ${contentClassName}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transitionDuration: isDragging ? "0ms" : "200ms",
          transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableItem;
