import React, { useState } from "react";
import { useAdminStaffMembers } from "@/services/admin/admin.queries";
import {
  useCreateStaffInvite,
  useRevokeStaffMember,
} from "@/services/admin/admin.mutations";
import { AdminStaffUser } from "@/types/admin.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuth } from "@/hooks/use-auth";
import { Icon, Sheet, Spinner } from "zmp-ui";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { openShareSheet } from "zmp-sdk/apis";
import { isZaloRuntime } from "@/utils/zalo-permissions";
import { copyToClipboard } from "@/utils/clipboard";

export default function AdminStaffPage() {
  const { customer: currentUser } = useAuth();
  const { showSuccess, showError } = useAppToast();
  const { data: staffList = [], isLoading } = useAdminStaffMembers();

  const createInviteMutation = useCreateStaffInvite();
  const revokeStaffMutation = useRevokeStaffMember();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"STAFF" | "ADMIN">("STAFF");
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(
    null,
  );
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Revoke state
  const [userToRevoke, setUserToRevoke] = useState<AdminStaffUser | null>(null);

  const handleGenerateInvite = async () => {
    try {
      const res = await createInviteMutation.mutateAsync({
        role: selectedRole,
      });

      const invitePath = `/staff/invite?token=${res.token}`;
      const fullUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${invitePath}`
          : invitePath;

      setGeneratedInviteUrl(fullUrl);
      setGeneratedToken(res.token);

      // Nếu đang trong Zalo SDK, có thể gọi mở Share Sheet trực tiếp
      if (isZaloRuntime()) {
        try {
          openShareSheet({
            type: "link",
            data: {
              link: fullUrl,
              title: `Mời tham gia Bếp Dì 6 với vai trò ${
                selectedRole === "ADMIN" ? "Quản trị viên" : "Nhân viên Bếp"
              }`,
              description:
                "Bấm vào link để kích hoạt quyền làm việc tại Bếp Dì 6 (Hết hạn sau 15 phút)",
            },
          });
        } catch (e) {
          console.warn("Could not open share sheet:", e);
        }
      }
    } catch (err: unknown) {
      showError((err as Error)?.message || "Không thể tạo link mời");
    }
  };

  const handleRevokeConfirm = async () => {
    if (!userToRevoke) return;
    try {
      await revokeStaffMutation.mutateAsync(userToRevoke.id);
      showSuccess(`Đã thu hồi quyền của ${userToRevoke.username}`);
      setUserToRevoke(null);
    } catch (err: unknown) {
      showError((err as Error)?.message || "Không thể thu hồi quyền");
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-24 font-sans">
      {/* Header Info */}
      <div className="border-b border-stone-200/80 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-stone-900">
              Đội Ngũ Nhân Sự
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              Phân quyền nhân viên qua Zalo an toàn không cần chạm server
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setGeneratedInviteUrl(null);
              setGeneratedToken(null);
              setIsInviteModalOpen(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            <Icon icon="zi-plus" className="shrink-0 text-sm" />
            <span>Mời nhân sự</span>
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <Icon icon="zi-user-group" className="shrink-0 text-2xl" />
            </div>
            <p className="mt-3 text-sm font-semibold text-stone-700">
              Chưa có nhân viên nào
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Bấm nút "Mời nhân sự" ở góc trên để tạo link mời qua Zalo
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map((member) => {
              const isMe = String(member.id) === String(currentUser?.id);
              const isAdmin = member.role === "ADMIN";

              return (
                <div
                  key={member.id}
                  className="shadow-xs flex items-center justify-between rounded-2xl border border-stone-200/80 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white ${
                        isAdmin ? "bg-amber-500" : "bg-blue-600"
                      }`}
                    >
                      {isAdmin ? (
                        <Icon icon="zi-admin" className="text-lg" />
                      ) : (
                        <Icon icon="zi-user" className="text-lg" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-900">
                          {member.name || member.username}
                        </span>
                        {isMe && (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            isAdmin
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isAdmin ? "Quản Trị Viên" : "Nhân Viên Bếp"}
                        </span>
                        {member.phone && <span>• {member.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => setUserToRevoke(member)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 transition-colors active:scale-95"
                    >
                      Tước quyền
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Modal Sheet */}
      <Sheet
        visible={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Mời Nhân Sự Mới Qua Zalo"
      >
        <div className="space-y-4 p-4 font-sans">
          {!generatedInviteUrl ? (
            <>
              <div>
                <label className="text-xs font-bold text-stone-700">
                  Chọn vai trò phân quyền
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("STAFF")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 transition-colors ${
                      selectedRole === "STAFF"
                        ? "border-primary bg-primary/5 font-bold text-primary"
                        : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    <Icon icon="zi-chat" className="mb-1 text-xl" />
                    <span className="text-xs">Nhân Viên Bếp (KDS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("ADMIN")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 transition-colors ${
                      selectedRole === "ADMIN"
                        ? "border-primary bg-primary/5 font-bold text-primary"
                        : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    <Icon icon="zi-admin" className="mb-1 text-xl" />
                    <span className="text-xs">Quản Trị Viên (Admin)</span>
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
                  * Link mời được bảo mật mã hóa cao cấp, chỉ dùng được duy nhất
                  1 lần và tự hủy sau 15 phút.
                </p>
              </div>

              <button
                type="button"
                disabled={createInviteMutation.isPending}
                onClick={handleGenerateInvite}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
              >
                {createInviteMutation.isPending ? (
                  <Spinner visible logo={false} />
                ) : (
                  <>
                    <Icon icon="zi-share" className="text-base" />
                    <span>Tạo Link & Chia Sẻ Qua Zalo</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                <div className="flex items-center justify-center text-emerald-600">
                  <Icon icon="zi-check-circle" className="text-2xl" />
                </div>
                <h4 className="mt-1 text-xs font-bold text-emerald-900">
                  Đã tạo mã mời thành công!
                </h4>
                <p className="mt-0.5 text-[11px] text-emerald-700">
                  Gửi link hoặc mã này cho nhân viên. Token hết hạn sau 15 phút.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <span className="text-[11px] font-semibold text-stone-500">
                  Mã Token kích hoạt:
                </span>
                <div className="mt-1 flex items-center justify-between">
                  <code className="select-all font-mono text-xs font-bold text-stone-800">
                    {generatedToken}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      if (generatedInviteUrl) {
                        copyToClipboard(generatedInviteUrl);
                        showSuccess("Đã sao chép link mời!");
                      }
                    }}
                    className="text-xs font-bold text-primary underline"
                  >
                    Sao chép link
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-700 active:scale-95"
                >
                  Đóng
                </button>
                {isZaloRuntime() && (
                  <button
                    type="button"
                    onClick={() => {
                      if (generatedInviteUrl) {
                        openShareSheet({
                          type: "link",
                          data: {
                            link: generatedInviteUrl,
                            title: `Mời tham gia Bếp Dì 6 (${selectedRole})`,
                            description: "Bấm để kích hoạt quyền làm việc",
                          },
                        });
                      }
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm active:scale-95"
                  >
                    <Icon icon="zi-share" className="text-sm" />
                    <span>Mở Share Zalo</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Sheet>

      {/* Confirm Revoke Modal */}
      <ConfirmModal
        visible={Boolean(userToRevoke)}
        title="Thu Hồi Quyền Nhân Sự"
        message={`Bạn có chắc chắn muốn tước quyền nhân sự của ${userToRevoke?.username}? Người này sẽ trở về quyền khách hàng bình thường.`}
        confirmText="Tước quyền"
        confirmVariant="danger"
        isLoading={revokeStaffMutation.isPending}
        onConfirm={handleRevokeConfirm}
        onCancel={() => setUserToRevoke(null)}
      />
    </div>
  );
}
