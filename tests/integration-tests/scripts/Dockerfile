FROM node:16-alpine${ALPINE_VERSION} AS run-tests
ARG ALPINE_VERSION=3.16
ARG AWS_CLI_VERSION=2.8.13

RUN apk update
RUN apk add --no-cache \
      build-base \
      cmake \
      git \
      groff \
      libffi-dev
RUN git clone --single-branch --depth 1 -b ${AWS_CLI_VERSION} https://github.com/aws/aws-cli.git

WORKDIR /aws-cli

WORKDIR /test-app

COPY tests/integration-tests ./tests/integration-tests
COPY package.json package-lock.json tsconfig.json tests/integration-tests/scripts/jest.integration.config.ts ./
COPY src/handlers/test-support/ ./src/handlers/test-support/
COPY src/shared/ ./src/shared/

RUN npm ci

WORKDIR /test-app/tests/integration-tests/scripts

RUN mv ./run-tests.sh /run-tests.sh
RUN chmod +x /run-tests.sh
ENTRYPOINT ["/run-tests.sh"]
