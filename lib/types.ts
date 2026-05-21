export interface Membro {
  id: string
  nome: string
  cargo: string
  categoria: 'docentes' | 'posdoc' | 'doutorado' | 'mestrado' | 'graduacao'
  foto?: string
  lattes?: string
  email?: string      // legado — mantido para compatibilidade
  emails?: string[]   // múltiplos e-mails
  telefones?: string[]
  bio?: string
  username?: string   // vincula ao User para auto-edição
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
  assignedTo?: string[]  // usernames marcados
  createdBy?: string     // username de quem criou
}

export interface TaskResponse {
  id: string
  eventoId: string
  username: string
  name: string
  resposta: 'aceito' | 'recusado'
  respondidoEm: string
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

export interface LabProject {
  id: string
  titulo: string
  descricao?: string
  status: 'em_andamento' | 'concluido'
  visibility: 'all' | 'assigned'
  assignedTo: string[]
  createdBy: string
  anoInicio?: number
  created_at?: string
}

export interface ProjectResponse {
  id: string
  projetoId: string
  username: string
  name: string
  resposta: 'aceito' | 'recusado'
  respondidoEm: string
}

export interface ProjectTask {
  id: string
  projetoId: string
  titulo: string
  descricao?: string
  status: 'todo' | 'em_andamento' | 'concluido'
  assignedTo: string[]   // multiple assignees
  createdBy: string
  created_at?: string
  order?: number
}
