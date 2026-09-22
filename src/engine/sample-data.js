export const SAMPLE_PROFILES = [
  {
    id: 'maria_silva',
    nome: 'Maria Silva',
    cpf: '***.***.123-45',
    cidade: 'São Paulo - SP',
    profissao: 'Analista de Sistemas',
    scoreBureau: 780,
    comprometimentoRenda: 22,
    tempoEmprego: 48,
    historicoInadimplencia: 0,
    relacaoDividaPatrimonio: 0.15,
    idadeContaBancaria: 72,
    tipoRenda: 'clt',
    consultasBureau: 1,
    renda: 8500,
    patrimonio: 120000,
    dividaTotal: 18000
  },
  {
    id: 'joao_santos',
    nome: 'João Santos',
    cpf: '***.***.456-78',
    cidade: 'Rio de Janeiro - RJ',
    profissao: 'Designer Freelancer',
    scoreBureau: 520,
    comprometimentoRenda: 38,
    tempoEmprego: 18,
    historicoInadimplencia: 1,
    relacaoDividaPatrimonio: 0.45,
    idadeContaBancaria: 36,
    tipoRenda: 'autonomo',
    consultasBureau: 3,
    renda: 4200,
    patrimonio: 35000,
    dividaTotal: 15750
  },
  {
    id: 'ana_oliveira',
    nome: 'Ana Oliveira',
    cpf: '***.***.789-01',
    cidade: 'Belo Horizonte - MG',
    profissao: 'Professora Aposentada',
    scoreBureau: 850,
    comprometimentoRenda: 15,
    tempoEmprego: 360,
    historicoInadimplencia: 0,
    relacaoDividaPatrimonio: 0.05,
    idadeContaBancaria: 240,
    tipoRenda: 'aposentado',
    consultasBureau: 0,
    renda: 3800,
    patrimonio: 280000,
    dividaTotal: 14000
  },
  {
    id: 'pedro_costa',
    nome: 'Pedro Costa',
    cpf: '***.***.234-56',
    cidade: 'Curitiba - PR',
    profissao: 'Entregador App',
    scoreBureau: 380,
    comprometimentoRenda: 55,
    tempoEmprego: 6,
    historicoInadimplencia: 3,
    relacaoDividaPatrimonio: 1.2,
    idadeContaBancaria: 12,
    tipoRenda: 'informal',
    consultasBureau: 6,
    renda: 2100,
    patrimonio: 8000,
    dividaTotal: 9600
  },
  {
    id: 'carlos_lima',
    nome: 'Carlos Lima',
    cpf: '***.***.567-89',
    cidade: 'Porto Alegre - RS',
    profissao: 'Gerente de Projetos',
    scoreBureau: 680,
    comprometimentoRenda: 42,
    tempoEmprego: 8,
    historicoInadimplencia: 0,
    relacaoDividaPatrimonio: 0.65,
    idadeContaBancaria: 24,
    tipoRenda: 'clt',
    consultasBureau: 2,
    renda: 12000,
    patrimonio: 85000,
    dividaTotal: 55200
  }
];

export function getRandomProfile() {
  return SAMPLE_PROFILES[Math.floor(Math.random() * SAMPLE_PROFILES.length)];
}

export function getProfileById(id) {
  return SAMPLE_PROFILES.find(p => p.id === id);
}