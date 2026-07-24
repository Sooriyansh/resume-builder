import { NextResponse } from "next/server";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string; field?: string };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function fail(code: string, message: string, status = 400, field?: string) {
  return NextResponse.json<ApiFailure>(
    { success: false, error: { code, message, ...(field ? { field } : {}) } },
    { status },
  );
}
