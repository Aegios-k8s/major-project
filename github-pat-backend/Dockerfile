# Build stage
FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Final stage
FROM alpine:3.21

# Install runtime dependencies: helm and ca-certificates
RUN apk add --no-cache ca-certificates curl bash openssl \
    && curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
    && chmod 700 get_helm.sh \
    && ./get_helm.sh \
    && rm get_helm.sh

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/main .

# Copy .env if it exists (though compose will override)
COPY .env* ./

# Expose the port the app runs on
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
