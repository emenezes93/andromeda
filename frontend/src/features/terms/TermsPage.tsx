import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * Página de Política de Privacidade e Termos de Uso (LGPD).
 * Versão 1.0 – conteúdo placeholder; pode ser substituído por texto jurídico real.
 */
export function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-display font-bold text-content">
          Política de Privacidade e Termos de Uso
        </h1>
        <p className="mt-1 text-body text-content-muted">
          Versão 1.0 – Última atualização: fevereiro de 2025
        </p>
      </div>

      <Card title="Política de Privacidade">
        <div className="prose prose-sm max-w-none text-content-muted">
          <p>
            A plataforma Anamnese Inteligente PaaS trata os dados pessoais e de saúde em
            conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei 13.709/2018).
          </p>
          <h3 className="mt-4 font-semibold text-content">Finalidade</h3>
          <p>
            Os dados coletados (cadastro de pacientes, respostas aos questionários de
            anamnese e evoluções) são utilizados exclusivamente para fins de atendimento
            em saúde, gestão clínica e geração de insights, conforme autorizado pelo
            titular ou pelo responsável legal.
          </p>
          <h3 className="mt-4 font-semibold text-content">Armazenamento e uso</h3>
          <p>
            As informações são armazenadas em ambiente seguro e utilizadas apenas pela
            organização (tenant) à qual o paciente está vinculado e pelos profissionais
            autorizados. Não realizamos comercialização de dados pessoais.
          </p>
          <h3 className="mt-4 font-semibold text-content">Seus direitos</h3>
          <p>
            O titular dos dados pode solicitar acesso, correção, anonimização, portabilidade
            ou eliminação dos dados, mediante contato com o responsável pelo tratamento
            na organização que o atende.
          </p>
        </div>
      </Card>

      <Card title="Termos de Uso">
        <div className="prose prose-sm max-w-none text-content-muted">
          <p>
            Ao utilizar a plataforma, o usuário declara estar ciente e de acordo com as
            práticas descritas na Política de Privacidade e com o uso dos dados para as
            finalidades informadas.
          </p>
          <p>
            O conteúdo gerado na plataforma (questionários, insights) tem caráter
            informativo e de apoio à decisão clínica, não substituindo o julgamento
            profissional nem o relacionamento entre profissional de saúde e paciente.
          </p>
        </div>
      </Card>

      <div className="flex justify-start">
        <Link to="/">
          <Button variant="outline">Voltar ao início</Button>
        </Link>
      </div>
    </div>
  );
}
