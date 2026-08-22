import { Avatar, Text, useSnackbar } from "zmp-ui";
import { copy } from "@/constants/copy";
import {
  ChevronRightIcon,
  MapPinIconSolid,
  ProfileUserIcon,
  VoucherIcon,
} from "@/components/common/vectors";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { openSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { customer, login, logout, isAuthenticated } = useAuth();

  const handleDevelopingClick = () => {
    openSnackbar({
      text: copy.profile.featureDeveloping,
      type: "warning",
    });
  };

  return (
    <div className="flex h-full flex-col bg-elevation-01">
      <div className="border-b border-neutral100 bg-white px-4 py-6">
        <div className="flex flex-col items-center">
          <Avatar
            src={
              customer?.avatar_url ||
              "https://h5.zadn.vn/static/images/avatar.png"
            }
            size={72}
            className="mb-3 border-2 border-primary/20"
          />
          <div className="text-base font-bold text-neutral900">
            {customer?.name || "Khách hàng Zalo"}
          </div>
          {customer?.phone && (
            <div className="mt-0.5 text-xs text-neutral500">
              {customer.phone}
            </div>
          )}
        </div>
      </div>

      <div className="shadow-2xs mx-3.5 mt-3 flex flex-col gap-4 rounded-xl border border-neutral100 bg-white p-4">
        <div
          className="active:bg-neutral50 flex cursor-pointer items-center justify-between py-2"
          onClick={() => navigate("/select-location")}
        >
          <div className="flex items-center gap-3 text-sm font-medium text-neutral800">
            <div className="text-primary">
              <MapPinIconSolid />
            </div>
            <div>Sổ địa chỉ giao hàng</div>
          </div>
          <ChevronRightIcon className="h-4 w-4 text-neutral400" />
        </div>

        <div
          className="active:bg-neutral50 flex cursor-pointer items-center justify-between py-2"
          onClick={handleDevelopingClick}
        >
          <div className="flex items-center gap-3 text-sm font-medium text-neutral800">
            <div className="text-amber-600">
              <VoucherIcon className="h-5 w-5" />
            </div>
            <div>Kho Voucher của tôi</div>
          </div>
          <ChevronRightIcon className="h-4 w-4 text-neutral400" />
        </div>

        <div
          className="active:bg-neutral50 flex cursor-pointer items-center justify-between py-2"
          onClick={handleDevelopingClick}
        >
          <div className="flex items-center gap-3 text-sm font-medium text-neutral800">
            <div className="text-blue-600">
              <ProfileUserIcon className="h-5 w-5" />
            </div>
            <div>Trung tâm hỗ trợ & CSKH</div>
          </div>
          <ChevronRightIcon className="h-4 w-4 text-neutral400" />
        </div>
      </div>
    </div>
  );
}
