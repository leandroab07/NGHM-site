import { NextResponse } from 'next/server'

export async function GET() { return NextResponse.redirect('/api/admin/eventos') }
export async function POST() { return NextResponse.json({ error: 'Use /api/admin/eventos' }, { status: 410 }) }
export async function PUT() { return NextResponse.json({ error: 'Use /api/admin/eventos' }, { status: 410 }) }
export async function DELETE() { return NextResponse.json({ error: 'Use /api/admin/eventos' }, { status: 410 }) }
