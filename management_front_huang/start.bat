@echo off
echo 正在启动管理后台系统...
echo.

echo 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo 检查npm环境...
npm --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到npm
    pause
    exit /b 1
)

echo.
echo 安装项目依赖...
npm install

if errorlevel 1 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 启动开发服务器...
echo 服务器将在 http://localhost:3000 启动
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause