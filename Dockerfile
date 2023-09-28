FROM semtech/mu-javascript-template:1.5.0-beta.1
LABEL maintainer="redpencil.io <info@repdencil.io>"
RUN apk update
RUN apk add curl