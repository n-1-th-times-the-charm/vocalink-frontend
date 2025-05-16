FROM node:18-alpine AS builder

ARG AAI_API_KEY
ENV VITE_AAI_API_KEY=$AAI_API_KEY

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]