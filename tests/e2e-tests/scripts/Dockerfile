ARG ALPINE_VERSION=3.16

FROM node:16-alpine${ALPINE_VERSION} AS run-tests
WORKDIR /test-app

COPY tests/e2e-tests ./tests/e2e-tests
COPY package.json package-lock.json tsconfig.json tests/e2e-tests/scripts/jest.e2e.config.ts ./
COPY src/handlers/test-support/ ./src/handlers/test-support/
COPY src/shared/ ./src/shared/

RUN npm ci

WORKDIR /test-app/tests/e2e-tests/scripts

RUN mv ./run-e2e-tests.sh /run-e2e-tests.sh
RUN chmod +x /run-e2e-tests.sh

ENTRYPOINT ["/run-e2e-tests.sh"]
