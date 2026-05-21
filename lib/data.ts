import { cache } from 'react'
import { supabase } from './supabase'
import { hashPassword } from './auth'
import type { Membro, Publicacao, Projeto, Evento, User, LabProject } from './types'

export async function getEquipe(): Promise<Membro[]> {
  const { data } = await supabase.from('equipe').select('*').order('nome')
  return (data ?? []) as Membro[]
}

export async function getPublicacoes(): Promise<Publicacao[]> {
  const { data } = await supabase.from('publicacoes').select('*').order('ano', { ascending: false })
  return (data ?? []) as Publicacao[]
}

export async function getProjetos(): Promise<Projeto[]> {
  const { data } = await supabase.from('projetos').select('*')
  return (data ?? []) as Projeto[]
}

export async function getEventos(): Promise<Evento[]> {
  const { data } = await supabase.from('eventos').select('*')
  return (data ?? []) as Evento[]
}

export async function getLabProjects(): Promise<LabProject[]> {
  const { data } = await supabase.from('lab_projects').select('*').order('created_at', { ascending: false })
  return (data ?? []) as LabProject[]
}

export const getUsers = cache(async (): Promise<User[]> => {
  const { data } = await supabase.from('users').select('*')
  let users = (data ?? []) as User[]

  const seedUsername = process.env.ADMIN_USERNAME
  const seedPassword = process.env.ADMIN_PASSWORD

  if (seedUsername && seedPassword && !users.find(u => u.username === seedUsername)) {
    const seed: User = {
      id: '1',
      username: seedUsername,
      passwordHash: hashPassword(seedPassword),
      role: 'admin',
      name: 'Administradora',
      email: '',
    }
    const { error } = await supabase.from('users').upsert(seed)
    if (!error) users = [seed, ...users]
  }
  return users
})
