FROM node:18 AS builder

WORKDIR /app

RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=yarn.lock,target=yarn.lock \
  yarn

COPY . .
RUN yarn run build

CMD [ "node", "./dist/main.js" ]

