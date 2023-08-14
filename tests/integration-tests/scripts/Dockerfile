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
RUN echo $ls
RUN sed -i 's/PyInstaller.*/PyInstaller==5.6.2/g' requirements-build.txt
RUN python -m venv venv
RUN . venv/bin/activate
RUN scripts/installers/make-exe
RUN unzip -q dist/awscli-exe.zip
RUN aws/install --bin-dir /aws-cli-bin
RUN /aws-cli-bin/aws --version
RUN rm -rf /usr/local/aws-cli/v2/current/dist/aws_completer /usr/local/aws-cli/v2/current/dist/awscli/data/ac.index /usr/local/aws-cli/v2/current/dist/awscli/examples
RUN find /usr/local/aws-cli/v2/current/dist/awscli/botocore/data -name examples-1.json -delete

FROM node:16-alpine${ALPINE_VERSION} AS run-tests

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
