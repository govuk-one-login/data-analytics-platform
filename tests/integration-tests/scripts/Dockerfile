ARG ALPINE_VERSION=3.16

FROM node:16-alpine${ALPINE_VERSION} AS run-tests

WORKDIR /test-app

COPY package.json package-lock.json tsconfig.json jest.integration.config.ts ./
COPY integration_tests ./tests/integration_tests
COPY src/handlers/test-support/ ./src/handlers/test-support/
COPY src/shared/ ./src/shared/

RUN npm ci

WORKDIR /test-app/integration-tests

RUN mv ./run-tests.sh /run-tests.sh
RUN chmod +x /run-tests.sh

## To run unit-tests for starters
#WORKDIR /test-app
#COPY jest.config.cjs ./
#COPY test-helpers ./test-helpers
#COPY src ./src

#ENV TEST_VIA_LAMBDA=true

ENTRYPOINT ["/run-tests.sh"]
