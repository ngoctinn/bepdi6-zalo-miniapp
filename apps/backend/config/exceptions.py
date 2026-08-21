"""Custom exception handler to format error responses according to the envelope spec:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi"
  }
}
"""

from rest_framework import status
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_code = "VALIDATION_ERROR"
        error_message = "Dữ liệu không hợp lệ"

        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            error_code = "UNAUTHORIZED"
            error_message = "Token không hợp lệ hoặc hết hạn"
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            error_code = "FORBIDDEN"
            error_message = "Không có quyền truy cập"
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            error_code = "NOT_FOUND"
            error_message = "Không tìm thấy tài nguyên"
        elif isinstance(response.data, dict):
            # Extract custom message if available
            if "detail" in response.data:
                error_message = str(response.data["detail"])
            elif "code" in response.data and "message" in response.data:
                error_code = response.data["code"]
                error_message = response.data["message"]
            else:
                error_message = str(response.data)

        custom_data = {
            "success": False,
            "error": {
                "code": error_code,
                "message": error_message,
            },
        }
        response.data = custom_data

    return response
