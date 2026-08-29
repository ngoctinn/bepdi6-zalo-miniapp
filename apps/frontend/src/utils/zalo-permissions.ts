import {
  authorize,
  getAccessToken,
  getLocation,
  getPhoneNumber,
  getSetting,
} from "zmp-sdk/apis";

type ZaloScope =
  | "scope.userInfo"
  | "scope.userLocation"
  | "scope.userPhonenumber";

export const isZaloRuntime = () => "ZaloMiniAppSDK" in window;

export async function ensureZaloPermission(scope: ZaloScope) {
  const { authSetting } = await getSetting({});
  if (authSetting[scope]) return;

  const result = await authorize({ scopes: [scope] });
  if (!result[scope]) {
    throw new Error("Người dùng chưa cấp quyền Zalo cần thiết");
  }
}

async function getRequiredAccessToken() {
  const accessToken = await getAccessToken({});
  if (!accessToken) {
    throw new Error("Zalo không trả về access token hợp lệ");
  }
  return accessToken;
}

export async function getZaloLoginAccessToken() {
  await ensureZaloPermission("scope.userInfo");
  return getRequiredAccessToken();
}

export async function getZaloLocationCredentials() {
  await ensureZaloPermission("scope.userLocation");
  const accessToken = await getRequiredAccessToken();
  const location = await getLocation({});

  if (!location?.token) {
    throw new Error("Zalo không trả về location token hợp lệ");
  }

  return { token: location.token, accessToken };
}

export async function getZaloPhoneCredentials() {
  await ensureZaloPermission("scope.userPhonenumber");
  const accessToken = await getRequiredAccessToken();
  const phone = await getPhoneNumber({});

  if (!phone?.token) {
    throw new Error("Zalo không trả về phone token hợp lệ");
  }

  return { token: phone.token, accessToken };
}
