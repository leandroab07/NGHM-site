import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers, getEquipe } from '@/lib/data'
import { supabase } from '@/lib/supabase'

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  return users.find(u => u.username === payload.sub) ?? null
}

// GET /api/equipe/me — retorna o cartão do usuário atual
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json(null)
  const equipe = await getEquipe()
  const membro = equipe.find(m => m.username === user.username)
  return NextResponse.json(membro ?? null)
}

// PUT /api/equipe/me — membro edita só os próprios campos permitidos
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const equipe = await getEquipe()
  const membro = equipe.find(m => m.username === user.username)
  if (!membro) return NextResponse.json({ error: 'Cartão de equipe não encontrado' }, { status: 404 })

  const body = await req.json()

  // Campos que o membro pode editar (nome e username só pelo admin)
  const allowed = {
    foto:      typeof body.foto      === 'string' ? body.foto      : membro.foto,
    bio:       typeof body.bio       === 'string' ? body.bio       : membro.bio,
    cargo:     typeof body.cargo     === 'string' ? body.cargo     : membro.cargo,
    categoria: ['docentes','posdoc','doutorado','mestrado','graduacao'].includes(body.categoria)
                 ? body.categoria : membro.categoria,
    lattes:    typeof body.lattes    === 'string' ? body.lattes    : membro.lattes,
    emails:    Array.isArray(body.emails)    ? body.emails.filter((e: unknown) => typeof e === 'string' && e.trim()) : (membro.emails ?? []),
    telefones: Array.isArray(body.telefones) ? body.telefones.filter((t: unknown) => typeof t === 'string' && t.trim()) : (membro.telefones ?? []),
  }

  const updated = { ...membro, ...allowed }
  const { error } = await supabase.from('equipe').update(updated).eq('id', membro.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated)
}
