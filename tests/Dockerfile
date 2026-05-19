ARG ALPINE_VERSION=3.21
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

WORKDIR /build-app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci


FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS run-tests

RUN apk update && \
      apk upgrade && \
      apk add --no-cache \
      bash \
      aws-cli \
      mandoc \
      curl

WORKDIR /test-app

# Run as non-root for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /build-app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY common ./common
COPY tests ./tests
COPY tests/run-tests.sh /

RUN chown -R appuser:appgroup /test-app /run-tests.sh && \
    chmod +x /run-tests.sh
USER appuser
WORKDIR /test-app/tests

ENTRYPOINT ["/run-tests.sh"]
