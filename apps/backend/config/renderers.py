"""Custom JSON renderer to format responses according to the envelope spec:
{
  "success": true,
  "data": ...
}
"""

from rest_framework.renderers import JSONRenderer


class EnvelopeJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context is not None:
            response = renderer_context.get("response")
            if response is not None:
                if response.status_code == 204:
                    return super().render(data, accepted_media_type, renderer_context)
                if response.status_code >= 400 and not (
                    isinstance(data, dict) and "success" in data
                ):
                    if isinstance(data, dict):
                        error_code = data.get("code", "ERROR")
                        error_message = (
                            data.get("message")
                            or data.get("detail")
                            or "Đã xảy ra lỗi."
                        )
                        err_obj = {"code": error_code, "message": str(error_message)}
                        if "details" in data:
                            err_obj["details"] = data["details"]
                        envelope_data = {
                            "success": False,
                            "error": err_obj,
                        }
                    else:
                        envelope_data = {
                            "success": False,
                            "error": {
                                "code": "ERROR",
                                "message": str(data) if data else "Đã xảy ra lỗi.",
                            },
                        }
                    return super().render(
                        envelope_data, accepted_media_type, renderer_context
                    )

        # Check if data is already in envelope format
        if isinstance(data, dict) and "success" in data:
            envelope_data = data
        else:
            envelope_data = {
                "success": True,
                "data": data,
            }

        return super().render(envelope_data, accepted_media_type, renderer_context)
