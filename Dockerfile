FROM node:20-alpine AS builder

WORKDIR /app

RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=yarn.lock,target=yarn.lock \
  yarn

COPY . .
RUN yarn run build

FROM node:20-alpine

COPY --link --from=builder /app/dist /app/dist
COPY --link --from=builder /app/node_modules /app/node_modules

WORKDIR /app

CMD [ "node", "./dist/main.js" ]

