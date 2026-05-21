export interface Membro {
  id: string
  nome: string
  cargo: string
  categoria: 'docentes' | 'posdoc' | 'doutorado' | 'mestrado' | 'graduacao'
  foto?: string
  lattes?: string
  email?: string
  bio?: string
}

export interface Publicacao {
  id: string
  titulo: string
  autores: string
  revista: string
  ano: number
  doi?: string
  resumo?: string
  categoria: 'artigo' | 'tese' | 'dissertacao' | 'livro' | 'capitulo'
}

export interface Projeto {
  id: string
  titulo: string
  descricao: string
  status: 'em_andamento' | 'concluido'
  anoInicio: number
  anoFim?: number
  financiamento?: string
  pesquisadores?: string[]
}

export interface Evento {
  id: string
  titulo: string
  data: string       // YYYY-MM-DD
  hora?: string      // HH:MM
  descricao?: string
  categoria: 'prova' | 'reuniao' | 'prazo' | 'aula' | 'evento' | 'outro'
}

export interface User {
  id: string
  username: string
  passwordHash: string
  role: 'admin' | 'member'
  name: string
  email?: string
}

export type PublicUser = Omit<User, 'passwordHash'>
