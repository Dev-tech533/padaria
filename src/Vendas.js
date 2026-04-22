import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './services/api';

export default function Vendas() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

   const carregarProdutos = async () => {
    setCarregando(true);
    try {
      const response = await apiFetch('/produtos');
      
      if (!response.ok) throw new Error('Falha na conexão');
      
      const data = await response.json();
      console.log('Dados brutos:', data);

      let listaFinal = [];

      // Lógica de segurança para extrair o array de qualquer formato
      if (data.success && Array.isArray(data.produtos)) {
        listaFinal = data.produtos;
      } else if (Array.isArray(data)) {
        listaFinal = data;
      } else {
        console.warn('Formato desconhecido, usando lista vazia');
        listaFinal = [];
      }

      setProdutos(listaFinal);
    } catch (erro) {
      console.error('Erro:', erro);
      window.alert('Erro ao conectar com o servidor de produtos.');
      setProdutos([]); // Garante que seja um array vazio, nunca null
    } finally {
      setCarregando(false);
    }
  };

  const adicionarAoCarrinho = (produto) => {
    const jaNoCarrinho = carrinho.find(item => item.id === produto.id);
    if (jaNoCarrinho) {
      setCarrinho(carrinho.map(item =>
        item.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
  };

  const removerDoCarrinho = (produtoId) => {
    const item = carrinho.find(i => i.id === produtoId);
    if (!item) return;
    if (item.quantidade === 1) {
      setCarrinho(carrinho.filter(i => i.id !== produtoId));
    } else {
      setCarrinho(carrinho.map(i =>
        i.id === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i
      ));
    }
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.preco_venda * item.quantidade, 0);

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      window.alert('Atenção!\nAdicione pelo menos um produto ao carrinho.');
      return;
    }
    if (!formaPagamento) {
      window.alert('Atenção!\nSelecione a forma de pagamento.');
      return;
    }

    setFinalizando(true);
    try {
      const response = await apiFetch('/venda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: carrinho.map(item => ({
            id: item.id,
            quantidade: item.quantidade,
            preco: item.preco_venda
          })),
          total: totalCarrinho,
          formaPagamento
        })
      });

      const data = await response.json();

      if (response.ok) {
        window.alert(`✅ SUCESSO!\nVenda finalizada!\nTotal: R$ ${totalCarrinho.toFixed(2)}`);
        setCarrinho([]);
        setFormaPagamento('');
        // Atualiza estoques nas outras telas se as funções existirem
        if(window.atualizarEstoque) window.atualizarEstoque();
        if(window.atualizarVendasDoDia) window.atualizarVendasDoDia();
      } else {
        window.alert('❌ ERRO!\n' + (data.error || 'Erro ao finalizar venda.'));
      }
    } catch (erro) {
      console.error('Erro ao finalizar venda:', erro);
      window.alert('❌ Erro ao conectar com o servidor.');
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <View style={styles.container}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url('/assets/images/imagemcadastro.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.6,
        zIndex: 0,
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.titulo}>🛒 Nova Venda</Text>
          <Text style={styles.subtitulo}>{new Date().toLocaleDateString('pt-BR')}</Text>

          {/* PRODUTOS */}
          <Text style={styles.sectionTitle}>📦 Produtos Disponíveis</Text>

          {carregando ? (
            <View style={styles.semItens}>
              <Text style={styles.semItensTexto}>Carregando produtos...</Text>
            </View>
          ) : produtos.length === 0 ? (
            <View style={styles.semItens}>
              <Text style={styles.semItensTexto}>Nenhum produto cadastrado</Text>
            </View>
          ) : (
            produtos.map(produto => (
              <View key={produto.id} style={styles.produtoItem}>
                <View style={styles.produtoInfo}>
                  <Text style={styles.produtoNome}>{produto.nome}</Text>
                  <Text style={styles.produtoCategoria}>{produto.categoria}</Text>
                  <Text style={styles.produtoPreco}>R$ {parseFloat(produto.preco_venda).toFixed(2)}</Text>
                  <Text style={styles.produtoEstoque}>Estoque: {produto.estoque}</Text>
                </View>
                <TouchableOpacity
                  style={styles.botaoAdicionar}
                  onPress={() => adicionarAoCarrinho(produto)}
                >
                  <Text style={styles.botaoAdicionarTexto}>+ Adicionar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* CARRINHO */}
          <Text style={styles.sectionTitle}>🛒 Carrinho</Text>

          {carrinho.length === 0 ? (
            <View style={styles.semItens}>
              <Text style={styles.semItensTexto}>Nenhum item adicionado</Text>
            </View>
          ) : (
            carrinho.map(item => (
              <View key={item.id} style={styles.carrinhoItem}>
                <View style={styles.carrinhoInfo}>
                  <Text style={styles.carrinhoNome}>{item.nome}</Text>
                  <Text style={styles.carrinhoSubtotal}>
                    R$ {(item.preco_venda * item.quantidade).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.carrinhoControles}>
                  <TouchableOpacity
                    style={styles.botaoQtd}
                    onPress={() => removerDoCarrinho(item.id)}
                  >
                    <Text style={styles.botaoQtdTexto}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtdTexto}>{item.quantidade}</Text>
                  <TouchableOpacity
                    style={styles.botaoQtd}
                    onPress={() => adicionarAoCarrinho(item)}
                  >
                    <Text style={styles.botaoQtdTexto}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* TOTAL */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValor}>R$ {totalCarrinho.toFixed(2)}</Text>
          </View>

          {/* PAGAMENTO */}
          <Text style={styles.sectionTitle}>💰 Forma de Pagamento</Text>
          <View style={styles.pagamentoContainer}>
            {['dinheiro', 'cartao', 'pix'].map(forma => (
              <TouchableOpacity
                key={forma}
                style={[styles.pagamentoBtn, formaPagamento === forma && styles.pagamentoAtivo]}
                onPress={() => setFormaPagamento(forma)}
              >
                <Text style={[styles.pagamentoTexto, formaPagamento === forma && styles.pagamentoTextoAtivo]}>
                  {forma === 'dinheiro' && '💵 Dinheiro'}
                  {forma === 'cartao' && '💳 Cartão'}
                  {forma === 'pix' && '📱 Pix'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* BOTÃO FINALIZAR */}
          <TouchableOpacity
            style={[styles.botaoFinalizar, finalizando && styles.botaoDesabilitado]}
            onPress={finalizarVenda}
            disabled={finalizando}
          >
            <Text style={styles.botaoFinalizarTexto}>
              {finalizando ? 'FINALIZANDO...' : '✅ FINALIZAR VENDA'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigate('/home')}>
            <Text style={styles.link}>Voltar ao Menu</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 20, position: 'relative', zIndex: 1 },
  formContainer: { width: '100%', maxWidth: 450, alignItems: 'center', padding: 30, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#d35400', marginBottom: 5 },
  subtitulo: { fontSize: 14, color: '#666', marginBottom: 25 },
  sectionTitle: { width: '100%', fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12, marginTop: 10, alignSelf: 'flex-start', paddingLeft: 5, borderLeftWidth: 4, borderLeftColor: '#d35400' },
  semItens: { width: '100%', backgroundColor: '#f9f9f9', borderRadius: 8, padding: 20, alignItems: 'center', marginBottom: 15 },
  semItensTexto: { fontSize: 13, color: '#999' },
  produtoItem: { width: '100%', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  produtoInfo: { flex: 1 },
  produtoNome: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  produtoCategoria: { fontSize: 11, color: '#999', marginTop: 2 },
  produtoPreco: { fontSize: 13, color: '#d35400', fontWeight: '600', marginTop: 3 },
  produtoEstoque: { fontSize: 11, color: '#aaa', marginTop: 2 },
  botaoAdicionar: { backgroundColor: '#d35400', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 10 },
  botaoAdicionarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  carrinhoItem: { width: '100%', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carrinhoInfo: { flex: 1 },
  carrinhoNome: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  carrinhoSubtotal: { fontSize: 13, color: '#d35400', fontWeight: '600', marginTop: 3 },
  carrinhoControles: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  botaoQtd: { backgroundColor: '#eee', borderRadius: 5, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  botaoQtdTexto: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  qtdTexto: { fontSize: 14, fontWeight: 'bold', marginHorizontal: 10, color: '#333' },
  totalContainer: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#d35400', borderRadius: 8, padding: 15, marginTop: 10, marginBottom: 20 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  totalValor: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  pagamentoContainer: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pagamentoBtn: { flex: 1, padding: 10, marginHorizontal: 3, backgroundColor: '#f4f4f4', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  pagamentoAtivo: { backgroundColor: '#d35400', borderColor: '#d35400' },
  pagamentoTexto: { fontSize: 12, color: '#666', fontWeight: '500' },
  pagamentoTextoAtivo: { color: '#fff', fontWeight: 'bold' },
  botaoFinalizar: { width: '100%', height: 45, backgroundColor: '#27ae60', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 3 },
  botaoDesabilitado: { backgroundColor: '#ccc' },
  botaoFinalizarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  link: { marginTop: 15, color: '#333', textDecorationLine: 'underline', fontSize: 13 },
});