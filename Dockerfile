FROM node:20-alpine as build
WORKDIR /application

# Install MSQ CA
ARG MSQ_ROOT_CA_PEM=''
RUN echo -n $MSQ_ROOT_CA_PEM | base64 -d > msq.pem && \
    npm config set cafile msq.pem

# Download dependencies
COPY package.json package-lock.json .npmrc tsconfig.json ./
COPY /src ./src/

RUN npm config set strict-ssl false -g
#RUN npm ci --omit=dev && npm update msq-moleculer-core
RUN npm ci

# Build package
RUN npm run build

# Bump version
ARG VERSION="v0.0.0-dev"
RUN npm version ${VERSION} --no-git-tag-version

FROM node:20-alpine 
WORKDIR /application

# Upgrade packages
RUN apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Setup user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Gather files
RUN mkdir config && chown nodejs:nodejs ./config
RUN mkdir -p src/db && chown nodejs:nodejs ./src/db
COPY --chown=nodejs:nodejs --from=build /application/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=build /application/package.json /application/package-lock.json ./
COPY --chown=nodejs:nodejs --from=build /application/dist ./dist/
COPY --chown=nodejs:nodejs /config ./config
COPY --chown=nodejs:nodejs /src ./src
COPY --chown=nodejs:nodejs /tsconfig.json ./tsconfig.json

USER nodejs
EXPOSE 3030 3040 3000

CMD ["npm", "run", "start:prod"]
