# renovate: image=swaggerapi/swagger-ui tag=v5.32.6
FROM swaggerapi/swagger-ui:v5.32.6

ENV SWAGGER_JSON=/app/openapi.json
ENV BASE_URL=/docs

COPY openapi.json /app/openapi.json

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO /dev/null http://localhost:8080/docs/ || exit 1
