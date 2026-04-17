import { useParams, Navigate } from "react-router-dom";
import { AjudaTemplate, AjudaContent } from "@/components/ajuda/AjudaTemplate";

// Exemplo de banco de dados estático para as páginas de ajuda
// Em uma aplicação real, isso poderia vir de um CMS ou Supabase
const AJUDA_DATABASE: Record<string, AjudaContent> = {
  "palpite-tech-e-confiavel": {
    slug: "palpite-tech-e-confiavel",
    title: "O Palpite Tech é confiável? Análise completa e testes reais",
    lastUpdate: "Janeiro 2024",
    mainKeyword: "Palpite Tech confiável",
    snippetAnswer: {
      question: "O Palpite Tech é realmente confiável?",
      answer: "Sim, o Palpite Tech é uma plataforma confiável que utiliza algoritmos matemáticos e estatísticos baseados em resultados oficiais da Caixa. O sistema oferece transparência total em suas análises, não promete ganhos fáceis e foca em aumentar as probabilidades através de fechamentos e desdobramentos técnicos validados.",
    },
    snippetList: {
      title: "Como funciona o sistema de segurança?",
      items: [
        "Criptografia SSL de ponta a ponta em todas as transações",
        "Processamento de pagamentos via gateways certificados e seguros",
        "Proteção de dados seguindo as diretrizes da LGPD",
        "Suporte humanizado para resolução de dúvidas técnicas",
      ],
    },
    snippetDefinition: {
      topic: "Palpite Tech",
      definition: "O Palpite Tech é um software avançado de análise de dados lotéricos que processa históricos de sorteios para identificar padrões matemáticos. Diferente de sistemas de sorte aleatória, ele utiliza inteligência de dados para gerar jogos com maior cobertura estatística e eficiência financeira.",
    },
    snippetComparison: {
      question: "É melhor que métodos tradicionais?",
      content: "Sim, pois enquanto métodos tradicionais dependem exclusivamente da sorte pura, o Palpite Tech aplica filtros de eliminação de combinações improváveis. Isso reduz o custo da aposta e aumenta as chances de premiação proporcional ao investimento realizado.",
    },
    quickSummary: {
      pros: [
        "Baseado em estatísticas oficiais da Caixa",
        "Ferramentas de fechamento matemático precisas",
        "Interface intuitiva e suporte rápido",
      ],
      limitation: "Não garante prêmios, pois loterias são jogos de probabilidade",
    },
    faq: [
      {
        question: "O Palpite Tech garante que vou ganhar?",
        answer: "Não. Nenhuma ferramenta legítima pode garantir ganhos em loterias. O Palpite Tech garante que seus jogos serão gerados com a melhor estratégia matemática possível para aquela modalidade.",
      },
      {
        question: "Posso testar antes de assinar?",
        answer: "Sim, oferecemos ferramentas gratuitas e demonstrações para que você entenda a lógica por trás de cada análise antes de se tornar um membro Premium.",
      },
      {
        question: "Como recebo meu acesso?",
        answer: "O acesso é imediato após a confirmação do pagamento. Você receberá os dados por e-mail e poderá acessar todas as ferramentas pelo dashboard.",
      },
    ],
    hiddenKeywords: [
      "Palpite Tech é seguro",
      "Análise Palpite Tech",
      "Reclame Aqui Palpite Tech",
      "Palpite Tech funciona mesmo",
      "Ganhar na loteria com matemática",
    ],
  },
};

const AjudaDetalhes = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug || !AJUDA_DATABASE[slug]) {
    // Redireciona para 404 ou lista de ajuda se o slug não existir
    return <Navigate to="/404" replace />;
  }

  const content = AJUDA_DATABASE[slug];

  return <AjudaTemplate content={content} />;
};

export default AjudaDetalhes;
