"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminRole = exports.normalizeRole = exports.buildAzureSqlAuthUser = void 0;
require("dotenv/config");
/**
 * Build Azure SQL authentication user
 * Chuyển email thành định dạng ODBC cho Azure SQL
 * Ví dụ: user@gmail.com + server.database.windows.net => user@gmail.com@server
 */
const buildAzureSqlAuthUser = (loginName) => {
    const server = process.env.DB_SERVER || "";
    const azureServerShortName = server.split(".")[0];
    if (azureServerShortName) {
        return `${loginName}@${azureServerShortName}`;
    }
    return loginName;
};
exports.buildAzureSqlAuthUser = buildAzureSqlAuthUser;
/**
 * Normalize role name (loại bỏ diacritics, whitespace, convert lowercase)
 * Dùng để so sánh role một cách consistent
 */
const normalizeRole = (role) => {
    return String(role || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .trim();
};
exports.normalizeRole = normalizeRole;
/**
 * Kiểm tra xem user là admin hay không
 */
const isAdminRole = (role) => {
    return normalizeRole(role) === "admin";
};
exports.isAdminRole = isAdminRole;
