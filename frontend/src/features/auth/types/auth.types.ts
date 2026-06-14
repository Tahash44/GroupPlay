/* شکل داده‌هایی که بین فرانت و بک‌اند رد و بدل میشه */

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
}
