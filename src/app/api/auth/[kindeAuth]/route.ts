import { NextResponse } from "next/server";

export const GET = async () =>
	NextResponse.json({ message: "Not found" }, { status: 404 });