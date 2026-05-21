import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'
import { supabase } from '@/lib/supabase'

const WINDOW_MS   = 15 * 60 * 1000  // 15 minutos
const MAX_ATTEMPTS = 10

async function checkRateLimit(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()
  // Limpar tentativas antigas e contar recentes numa transação implícita
  await supabase.from('login_attempts').delete().lt('attempted_at', windowStart)
  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('attempted_at', windowStart)
  return (count ?? 0) >= MAX_ATTEMPTS
}

async function recordAttempt(ip: string) {
  await supabase.from('login_attempts').insert({ ip })
}

async function clearAttempts(ip: string) {
  await supabase.from('login_attempts').delete().eq('ip', ip)
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)

    if (await checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      )
    }

    const { username, password } = await req.json()
    if (!username || !password) {
      await recordAttempt(ip)
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 })
    }

    const users = await getUsers()
    const user = users.find(u => u.username === username)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      await recordAttempt(ip)
      return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
    }

    // Login bem-sucedido: limpar histórico de tentativas do IP
    await clearAttempts(ip)

    const token = createToken(user.username)
    const response = NextResponse.json({ success: true, role: user.role, name: user.name })
    response.cookies.set('nghm-admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
