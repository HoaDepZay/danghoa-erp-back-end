import "dotenv/config";

/**
 * Build Azure SQL authentication user
 * Chuyển email thành định dạng ODBC cho Azure SQL
 * Ví dụ: user@gmail.com + server.database.windows.net => user@gmail.com@server
 */
const buildAzureSqlAuthUser = (loginName: string): string => {
  const server = process.env.DB_SERVER || "";
  const azureServerShortName = server.split(".")[0];

  if (azureServerShortName) {
    return `${loginName}@${azureServerShortName}`;
  }

  return loginName;
};

/**
 * Normalize role name (loại bỏ diacritics, whitespace, convert lowercase)
 * Dùng để so sánh role một cách consistent
 */
const normalizeRole = (role: unknown): string => {
  return String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
};

/**
 * Kiểm tra xem user là admin hay không
 */
const isAdminRole = (role: unknown): boolean => {
  return normalizeRole(role) === "admin";
};

export { buildAzureSqlAuthUser, normalizeRole, isAdminRole };
