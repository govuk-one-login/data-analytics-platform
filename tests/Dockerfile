ARG ALPINE_VERSION=3.21
ARG NODE_VERSION=22

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

COPY --from=builder /build-app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY tests ./tests
COPY tests/run-tests.sh /


RUN chmod +x /run-tests.sh
WORKDIR /test-app/tests

ENTRYPOINT ["/run-tests.sh"]
