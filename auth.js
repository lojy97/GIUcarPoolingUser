import * as cookie from "cookie";
import jwt from "jsonwebtoken";

export function fetchRole(headerCookies) {
    if (headerCookies === undefined) {
        return "Unauthorized";
    }
    const cookies = cookie.parse(headerCookies);
    if (cookies.Authorization === undefined || cookies.Authorization === null) {
        return "Unauthorized";
    }
    const auth = jwt.verify(cookies.Authorization, process.env.JWT_SECRET_KEY);
    return auth.role;
}

export function fetchId(headerCookies) {
    if (headerCookies === undefined) {
        return "Unauthorized";
    }
    const cookies = cookie.parse(headerCookies);
    if (cookies.Authorization === undefined || cookies.Authorization === null) {
        return "Unauthorized";
    }
    const auth = jwt.verify(cookies.Authorization, process.env.JWT_SECRET_KEY);
    return auth.id;
}

export function checkAuth(rolesAuthorized, rolePassed) {
    if (rolesAuthorized.includes(rolePassed))
        return true;
    return false;
}
