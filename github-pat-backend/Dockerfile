# Build stage
FROM golang:1.24.2-alpine AS builder

RUN sed -i 's/https/http/g' /etc/apk/repositories

# Add CA certificates + git
RUN apk add --no-cache git ca-certificates && update-ca-certificates

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Copy vendored dependencies to keep Docker build independent of remote module proxies
COPY vendor ./vendor

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOFLAGS=-mod=vendor go build -o main .

# Final stage
FROM alpine:3.21

RUN sed -i 's/https/http/g' /etc/apk/repositories

# Install runtime dependencies from Alpine repositories
RUN apk add --no-cache ca-certificates curl bash openssl kubectl helm \
    && update-ca-certificates

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/main .

# Copy .env if it exists (though compose will override)
COPY .env* ./

# Expose the port the app runs on
EXPOSE 8080

# Command to run the executable
CMD ["./main"]

