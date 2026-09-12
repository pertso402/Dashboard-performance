import { useEffect, useState } from 'react'
import { Cartao, Vazio } from '../components/Ui'
import { carregarDepoimentos } from '../lib/api'
import { dataLonga, num } from '../lib/format'
import type { Depoimento } from '../lib/tipos'

const CATEGORIA_LABEL: Record<string, string> = {
  atendimento: 'Atendimento',
  velocidade: 'Velocidade da entrega',
  comida: 'Comida',
  suporte: 'Suporte',
}

export function Depoimentos() {
  const [itens, setItens] = useState<Depoimento[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    carregarDepoimentos()
      .then(setItens)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Falha ao carregar.'))
  }, [])

  if (erro) {
    return (
      <Cartao titulo="O que os clientes estão falando">
        <Vazio>{erro}</Vazio>
      </Cartao>
    )
  }

  if (!itens) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl border border-borda bg-superficie" />
        ))}
      </div>
    )
  }

  if (itens.length === 0) {
    return (
      <Cartao
        titulo="O que os clientes estão falando"
        subtitulo="Prints de elogios ao atendimento, à velocidade da entrega e ao suporte."
      >
        <Vazio>
          <div className="max-w-md space-y-2 px-4">
            <p className="font-medium text-tinta-2">Nenhum depoimento cadastrado ainda.</p>
            <p>
              Suba os prints no bucket <code className="text-tinta-2">depoimentos</code> do Supabase
              Storage e cadastre cada um na tabela{' '}
              <code className="text-tinta-2">depoimentos</code> com a URL pública da imagem.
            </p>
          </div>
        </Vazio>
      </Cartao>
    )
  }

  const destaques = itens.filter((d) => d.destaque)
  const demais = itens.filter((d) => !d.destaque)

  return (
    <div className="space-y-5">
      <Cartao
        titulo="O que os clientes estão falando"
        subtitulo={`${num(itens.length)} ${
          itens.length === 1 ? 'elogio registrado' : 'elogios registrados'
        } sobre atendimento, velocidade de entrega e suporte.`}
      >
        {destaques.length > 0 && (
          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            {destaques.map((d) => (
              <CartaoDepoimento key={d.id} d={d} grande />
            ))}
          </div>
        )}

        {demais.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {demais.map((d) => (
              <CartaoDepoimento key={d.id} d={d} />
            ))}
          </div>
        ) : (
          destaques.length === 0 && <Vazio>Nenhum depoimento cadastrado ainda.</Vazio>
        )}
      </Cartao>
    </div>
  )
}

function CartaoDepoimento({ d, grande = false }: { d: Depoimento; grande?: boolean }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-xl border border-borda bg-superficie">
      {d.imagem_url && (
        <a
          href={d.imagem_url}
          target="_blank"
          rel="noreferrer"
          className="block bg-fundo"
          title="Abrir o print em tamanho real"
        >
          <img
            src={d.imagem_url}
            alt={
              d.cliente_nome
                ? `Print da conversa com ${d.cliente_nome}`
                : 'Print da conversa com um cliente'
            }
            loading="lazy"
            className={`w-full object-contain ${grande ? 'max-h-[420px]' : 'max-h-64'}`}
          />
        </a>
      )}

      {(d.texto || d.cliente_nome) && (
        <figcaption className="flex flex-1 flex-col gap-2 border-t border-borda p-4">
          {d.texto && (
            <blockquote className="text-sm leading-relaxed text-tinta">
              &ldquo;{d.texto}&rdquo;
            </blockquote>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tinta-3">
            {d.cliente_nome && (
              <span className="font-medium text-tinta-2">{d.cliente_nome}</span>
            )}
            <span className="rounded-full border border-borda px-2 py-0.5">
              {CATEGORIA_LABEL[d.categoria] ?? d.categoria}
            </span>
            {d.data_depoimento && <span className="tnum">{dataLonga(d.data_depoimento)}</span>}
          </div>
        </figcaption>
      )}
    </figure>
  )
}
