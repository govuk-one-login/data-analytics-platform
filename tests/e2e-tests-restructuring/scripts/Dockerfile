ARG ALPINE_VERSION=3.16
FROM python:alpine${ALPINE_VERSION} AS builder
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
RUN sed -i 's/PyInstaller.*/PyInstaller==5.6.2/g' requirements-build.txt
RUN python -m venv venv
RUN . venv/bin/activate
RUN scripts/installers/make-exe
RUN unzip -q dist/awscli-exe.zip
RUN aws/install --bin-dir /aws-cli-bin
RUN /aws-cli-bin/aws --version
RUN rm -rf /usr/local/aws-cli/v2/current/dist/aws_completer /usr/local/aws-cli/v2/current/dist/awscli/data/ac.index /usr/local/aws-cli/v2/current/dist/awscli/examples
RUN find /usr/local/aws-cli/v2/current/dist/awscli/botocore/data -name examples-1.json -delete

FROM node:22.14-alpine3.21@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944 AS run-tests

COPY --from=builder /usr/local/bin/python /usr/local/bin/python
COPY --from=builder /usr/local/lib/ /usr/local/lib/
COPY --from=builder /usr/local/aws-cli/ /usr/local/aws-cli/
COPY --from=builder /aws-cli-bin/ /usr/local/bin/

RUN apk update && \
      apk upgrade && \
      apk add --no-cache \
      bash

RUN apk add --no-cache --upgrade grep

WORKDIR /test-app

RUN aws --version

COPY tests ./tests
COPY scripts ./scripts
COPY package.json package-lock.json tsconfig.json ./
COPY tests/e2e-tests-restructuring/scripts/jest.e2e.config.js ./jest.config.js
COPY tests/e2e-tests-restructuring/scripts/jest.e2e.setup.js ./jest.setup.js
COPY src/handlers/test-support/ ./src/handlers/test-support/
COPY src/shared/ ./src/shared/

RUN npm ci

WORKDIR /test-app/tests/e2e-tests-restructuring/scripts

RUN mv ./run-e2e-tests.sh /run-tests.sh
RUN chmod +x /run-tests.sh

ENTRYPOINT ["/run-tests.sh"]
