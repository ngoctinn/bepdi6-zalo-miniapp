import { Avatar } from "zmp-ui";
import { copy } from "@/constants/copy";
import {
  ChevronRightIcon,
  MapPinIconSolid,
  ProfileUserIcon,
  VoucherIcon,
} from "@/components/common/vectors";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useAppToast } from "@/hooks/use-app-toast";

export default function ProfilePage() {
  const { showWarning } = useAppToast();
  const navigate = useNavigate();
  const { customer, login, logout, isAuthenticated } = useAuth();

  const handleDevelopingClick = () => {
    showWarning(copy.profile.featureDeveloping);
  };

  return (
    <div className="relative flex h-full flex-col bg-transparent">
      {/* Sticky Header: Nền sạch sẽ đồng bộ toàn hệ thống */}
      <div className="sticky top-0 z-30 flex flex-col border-b border-black/5 bg-white/95 pb-4 backdrop-blur-md">
        <div className="header-margin px-3.5 pb-1 pr-20 pt-3">
          <h1 className="text-base font-extrabold tracking-tight text-neutral-900">
            {copy.profile.title}
          </h1>
        </div>

        <div className="mt-2 flex flex-col items-center">
          <Avatar
            src={
              customer?.avatar_url ||
              "https://h5.zadn.vn/static/images/avatar.png"
            }
            size={64}
            className="mb-2.5 border-2 border-primary/30 ring-2 ring-white/50"
          />
          <div className="text-base font-bold text-neutral900">
            {customer?.name || copy.profile.sampleName}
          </div>
          {customer?.phone && (
            <div className="mt-0.5 text-xs text-neutral600">
              {customer.phone}
            </div>
          )}
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-3.5 py-4 pb-24">
        <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-transparent p-4">
          <div
            className="flex cursor-pointer items-center justify-between rounded-xl p-2 transition-all active:bg-black/[0.03]"
            onClick={() => navigate("/select-location")}
          >
            <div className="flex items-center gap-3 text-sm font-medium text-neutral800">
              <div className="text-primary">
                <MapPinIconSolid />
              </div>
              <div>{copy.profile.addresses}</div>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-neutral400" />
          </div>

          <div
            className="flex cursor-pointer items-center justify-between rounded-xl p-2 transition-all active:bg-black/[0.03]"
            onClick={handleDevelopingClick}
          >
            <div className="flex items-center gap-3 text-sm font-medium text-neutral800">
              <div className="text-amber-600">
                <VoucherIcon className="h-5 w-5" />
              </div>
              <div>{copy.profile.vouchers}</div>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-neutral400" />
          </div>

          <div
            className="flex cursor-pointer items-center justify-between rounded-xl p-2 transition-all active:bg-black/[0.03]"
            onClick={handleDevelopingClick}
          >
            <div className="flex items-center gap-3 text-sm font-medium text-neutral800">
              <div className="text-primary">
                <ProfileUserIcon className="h-5 w-5" />
              </div>
              <div>{copy.profile.supportCenter}</div>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-neutral400" />
          </div>
        </div>
      </div>
    </div>
  );
}
