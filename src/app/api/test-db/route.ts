import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if env vars exist
    const hasDbUrl = !!process.env.DATABASE_URL;
    const hasPostgresUrl = !!process.env.POSTGRES_URL;

    return NextResponse.json({
      status: 'ok',
      env: {
        DATABASE_URL: hasDbUrl ? 'SET' : 'MISSING',
        POSTGRES_URL: hasPostgresUrl ? 'SET' : 'MISSING',
        DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 15) || 'EMPTY',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
}
