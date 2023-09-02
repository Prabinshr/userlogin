import * as dotenv from "dotenv"

dotenv.config()

export const TOKENS = {
    TOKEN_SECRET : process.env.JWT_ACCESS_TOKEN ,
    TOKEN_EXPIRES_IN : process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN:process.env.JWT_REFRESH_TOKEN,
    REFRESH_TOKEN_EXPIRES_IN:process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
}