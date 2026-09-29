# renovate: image=swaggerapi/swagger-ui tag=v5.33.0
FROM swaggerapi/swagger-ui:v5.33.0@sha256:f9b8432be04e320406157e26c3ff52a7e9a4bea7eabe5477e9636791737eb119

ENV SWAGGER_JSON=/app/openapi.json
ENV BASE_URL=/docs

COPY openapi.json /app/openapi.json

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO /dev/null http://localhost:8080/docs/ || exit 1
