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
            if response is not None and response.status_code >= 400:
                # Error responses are already formatted by the custom exception handler
                return super().render(data, accepted_media_type, renderer_context)

        # Check if data is already in envelope format
        if isinstance(data, dict) and ("success" in data):
            envelope_data = data
        else:
            envelope_data = {
                "success": True,
                "data": data,
            }

        return super().render(envelope_data, accepted_media_type, renderer_context)
