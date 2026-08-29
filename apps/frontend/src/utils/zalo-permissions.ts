import {
  authorize,
  getAccessToken,
  getLocation,
  getPhoneNumber,
  getSetting,
  getUserInfo,
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

export async function getZaloLoginCredentials() {
  try {
    const accessToken = await getRequiredAccessToken();
    const { userInfo } = await getUserInfo({});
    return {
      accessToken,
      name: userInfo?.name || "",
      avatar: userInfo?.avatar || "",
    };
  } catch (error) {
    console.warn("Failed to get Zalo user info locally", error);
    try {
      const accessToken = await getRequiredAccessToken();
      return { accessToken, name: "", avatar: "" };
    } catch {
      return { accessToken: "", name: "", avatar: "" };
    }
  }
}

export async function getZaloLocationCredentials() {
  await ensureZaloPermission("scope.userLocation");
  const accessToken = await getRequiredAccessToken();
  const location: any = await getLocation({});

  // ZMP SDK Location can return a token (server-to-server) OR raw coordinates depending on the app/SDK context
  if (location?.token) {
    return { token: location.token, accessToken };
  } else if (location?.latitude && location?.longitude) {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      token: null, // Indicates raw coordinates
    };
  }

  throw new Error("Zalo không trả về location hợp lệ");
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
