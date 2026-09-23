"""Custom exception handler to format error responses according to the envelope spec:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi",
    "details": ... (optional)
  }
}
"""

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def _clean_error_details(data):
    """Recursively converts ErrorDetail objects to standard Python types (dict, list, str)."""
    if isinstance(data, dict):
        return {str(k): _clean_error_details(v) for k, v in data.items()}
    if isinstance(data, (list, tuple)):
        return [_clean_error_details(item) for item in data]
    return str(data)


def _extract_first_error_message(data) -> str | None:
    """Extracts the first readable error message from error details."""
    if isinstance(data, str):
        return data
    if isinstance(data, (list, tuple)) and data:
        return _extract_first_error_message(data[0])
    if isinstance(data, dict) and data:
        if "non_field_errors" in data:
            return _extract_first_error_message(data["non_field_errors"])
        if "detail" in data:
            return _extract_first_error_message(data["detail"])
        first_key = next(iter(data))
        field_msg = _extract_first_error_message(data[first_key])
        if field_msg:
            return f"{first_key}: {field_msg}"
    return None


def custom_exception_handler(exc, context):
    """
    Standard DRF exception handler with envelope formatting and unhandled 500 catch.
    """
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled server exception (e.g., ValueError, DatabaseError, ZeroDivisionError)
        logger.exception("Unhandled server exception: %s", exc, exc_info=exc)
        return Response(
            {
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Đã xảy ra lỗi máy chủ nội bộ.",
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    error_code = "VALIDATION_ERROR"
    error_message = "Dữ liệu không hợp lệ"
    details = None

    if response.status_code == status.HTTP_401_UNAUTHORIZED:
        error_code = "UNAUTHORIZED"
        error_message = "Token không hợp lệ hoặc hết hạn"
    elif response.status_code == status.HTTP_403_FORBIDDEN:
        error_code = "FORBIDDEN"
        error_message = "Không có quyền truy cập"
    elif response.status_code == status.HTTP_404_NOT_FOUND:
        error_code = "NOT_FOUND"
        error_message = "Không tìm thấy tài nguyên"
    elif response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
        error_code = "METHOD_NOT_ALLOWED"
        error_message = "Phương thức không được hỗ trợ."

    if isinstance(response.data, dict):
        if "code" in response.data and "message" in response.data:
            error_code = str(response.data["code"])
            error_message = str(response.data["message"])
            if "details" in response.data:
                details = _clean_error_details(response.data["details"])
        elif "detail" in response.data:
            detail_val = response.data["detail"]
            if isinstance(detail_val, (str, bytes)):
                detail_str = str(detail_val)
                if detail_str not in (
                    "Not found.",
                    "Authentication credentials were not provided.",
                    "You do not have permission to perform this action.",
                ):
                    error_message = detail_str
            else:
                details = _clean_error_details(detail_val)
                extracted = _extract_first_error_message(details)
                if extracted:
                    error_message = extracted
        else:
            details = _clean_error_details(response.data)
            extracted = _extract_first_error_message(details)
            if extracted:
                error_message = extracted
    elif isinstance(response.data, (list, tuple)):
        details = _clean_error_details(response.data)
        extracted = _extract_first_error_message(details)
        if extracted:
            error_message = extracted
    elif response.data is not None:
        error_message = str(response.data)

    error_payload = {
        "code": error_code,
        "message": error_message,
    }
    if details is not None:
        error_payload["details"] = details

    response.data = {
        "success": False,
        "error": error_payload,
    }

    return response
