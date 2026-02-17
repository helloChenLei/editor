# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装依赖（git 和 gcc 是必需的，gcc 用于 CGO）
RUN apk add --no-cache git gcc musl-dev

# 复制依赖文件
COPY go.mod go.sum ./

# 配置国内 Go 代理
ENV GOPROXY=https://goproxy.cn,direct
ENV GOSUMDB=sum.golang.google.cn

RUN go mod download

# 复制源码
COPY main.go .

# 构建
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o server main.go

# 运行阶段
FROM alpine:latest

WORKDIR /app

# 安装 SQLite 依赖
RUN apk add --no-cache ca-certificates sqlite-libs

# 复制可执行文件
COPY --from=builder /app/server .

# 创建数据目录
RUN mkdir -p data

# 暴露端口
EXPOSE 8080

# 运行
CMD ["./server"]
