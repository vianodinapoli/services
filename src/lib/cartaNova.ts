export type Motorista = { nome_completo: string; carta_conducao: string; do_numero: string };
export type VerificarResp = {
  tem_lista: boolean;
  na_lista: boolean;
  matricula: string;
  motoristas: Motorista[];
};

export async function verificarMatricula(operationId: number, matricula: string): Promise<VerificarResp> {
  const r = await fetch(
    `/api/laravel/operations/${operationId}/carta-nova/verificar?matricula=${encodeURIComponent(matricula)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!r.ok) throw new Error('Falha ao verificar a matrícula');
  return r.json();
}

export type Sugestao = { matricula: string; nome_completo: string; carta_conducao: string; do_numero: string };

export async function pesquisarMatriculas(operationId: number, q: string): Promise<Sugestao[]> {
  const r = await fetch(
    `/api/laravel/operations/${operationId}/carta-nova/pesquisar?q=${encodeURIComponent(q)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!r.ok) throw new Error('Falha na pesquisa');
  return (await r.json()).resultados;
}
