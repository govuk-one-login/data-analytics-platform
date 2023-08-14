ARG ALPINE_VERSION=3.16

FROM node:16-alpine${ALPINE_VERSION} AS run-tests

WORKDIR /test-app

COPY package.json package-lock.json tsconfig.json tests/scripts/jest.integration.config.ts ./
COPY tests/integration-tests ./tests/integration-tests
COPY src/handlers/test-support/ ./src/handlers/test-support/
COPY src/shared/ ./src/shared/
COPY tests/scripts/ ./tests/scripts/

RUN npm ci

WORKDIR /test-app/tests/scripts

RUN mv ./run-tests.sh /run-tests.sh
RUN chmod +x /run-tests.sh
ENTRYPOINT ["/run-tests.sh"]
