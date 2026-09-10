import jwt, { SignOptions } from "jsonwebtoken";
import { JwtPayload } from "../types";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
};

const getJwtExpiresIn = (): SignOptions["expiresIn"] => {
  return (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
};

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
};
