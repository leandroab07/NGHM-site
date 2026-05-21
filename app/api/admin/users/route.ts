import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, hashPassword } from '@/lib/auth'
import { getUsers } from '@/lib/data'
import { supabase } from '@/lib/supabase'

async function getAdmin(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  const user = users.find(u => u.username === payload.sub)
  return user?.role === 'admin' ? user : null
}

export async function GET(req: NextRequest) {
  if (!await getAdmin(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const users = await getUsers()
  return NextResponse.json(users.map(({ passwordHash: _, ...u }) => u))
}

export async function POST(req: NextRequest) {
  if (!await getAdmin(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { username, password, role, name, email } = await req.json()
  if (!username || !password || !role || !name) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }
  const users = await getUsers()
  if (users.find(u => u.username === username)) {
    return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 })
  }
  const newUser = {
    id: Date.now().toString(),
    username,
    passwordHash: hashPassword(password),
    role,
    name,
    email: email || '',
  }
  const { error } = await supabase.from('users').insert(newUser)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { passwordHash: _, ...pub } = newUser
  return NextResponse.json(pub, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id, username, password, role, name, email } = await req.json()
  const users = await getUsers()
  const existing = users.find(u => u.id === id)
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  const updated = {
    ...existing,
    username: username || existing.username,
    role: role || existing.role,
    name: name || existing.name,
    email: email ?? existing.email,
    ...(password ? { passwordHash: hashPassword(password) } : {}),
  }
  const { error } = await supabase.from('users').update(updated).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { passwordHash: _, ...pub } = updated
  return NextResponse.json(pub)
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await req.json()
  const users = await getUsers()
  const target = users.find(u => u.id === id)
  if (target?.username === admin.username) {
    return NextResponse.json({ error: 'Não é possível remover sua própria conta' }, { status: 400 })
  }
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
