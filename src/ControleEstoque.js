import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './services/api';

export default function ControleEstoque() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregarProdutos = async () => {
    setCarregando(true);
    try {
      const response = await apiFetch('/produtos');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const dados = await response.json();
      console.log('Resposta bruta do servidor:', dados);

      let listaRecebida = [];

      // BLINDAGEM TOTAL: Aceita vários formatos possíveis
      if (Array.isArray(dados)) {
        listaRecebida = dados;
      } else if (dados && Array.isArray(dados.produtos)) {
        listaRecebida = dados.produtos;
      } else if (dados && Array.isArray(dados.data)) {
        listaRecebida = dados.data;
      } else {
        console.warn('Formato de dados desconhecido, usando lista vazia.', dados);
        listaRecebida = [];
      }

      // Garante que seja sempre um array antes de mapear
      const produtosFormatados = Array.isArray(listaRecebida) ? listaRecebida.map(produto => ({
        id: produto.id || Math.random(), // ID fallback
        nomeProduto: produto.nome || produto.nome_produto || 'Sem nome',
        estoque: parseInt(produto.estoque || produto.quantidade_estoque || 0),
        preco: parseFloat(produto.preco_venda || produto.preco_produto || 0),
        categoria: produto.categoria || 'Geral'
      })) : [];

      setProdutos(produtosFormatados);

    } catch (erro) {
      console.error('Erro crítico ao carregar:', erro);
      // Em caso de erro, define como array vazio para não quebrar o .map
      setProdutos([]); 
      Alert.alert('Atenção', 'Não foi possível conectar ao banco de dados. Verifique o servidor.');
    } finally {
      setCarregando(false);
    }
  };



  const confirmarAtualizacao = () => {
    if (carregando) return;

    const confirmar = window.confirm('Deseja atualizar o controle de estoque agora?');
    if (!confirmar) return;

    carregarProdutos();
  };

  const removerUnidade = async (produto) => {
    if (carregando) return;

    if (produto.estoque <= 0) {
      window.alert('Este produto já está com estoque zerado.');
      return;
    }

    const confirmar = window.confirm(`Remover 1 unidade de "${produto.nomeProduto}"?`);
    if (!confirmar) return;

    try {
      const response = await apiFetch(`/produtos/${produto.id}/remover-unidade`, {
        method: 'PATCH',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível remover a unidade.');
      }

      window.alert('Unidade removida com sucesso.');
      carregarProdutos();
    } catch (erro) {
      console.error('Erro ao remover unidade:', erro);
      window.alert(erro.message || 'Não foi possível remover a unidade.');
    }
  };

  const excluirProduto = async (produto) => {
    if (carregando) return;

    const confirmar = window.confirm(`Tem certeza que deseja excluir o produto "${produto.nomeProduto}"?`);
    if (!confirmar) return;

    try {
      const response = await apiFetch(`/produtos/${produto.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível excluir o produto.');
      }

      window.alert('Produto excluído com sucesso.');
      carregarProdutos();
    } catch (erro) {
      console.error('Erro ao excluir produto:', erro);
      window.alert(erro.message || 'Não foi possível excluir o produto.');
    }
  };

  useEffect(() => {
    carregarProdutos();
    window.atualizarEstoque = carregarProdutos;
    return () => { delete window.atualizarEstoque; };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.titulo}>📦 Controle de Estoque</Text>
        
        {carregando ? (
          <View style={styles.semProdutosContainer}>
            <Text style={styles.semProdutos}>Carregando...</Text>
          </View>
        ) : produtos.length === 0 ? (
          <View style={styles.semProdutosContainer}>
            <Text style={styles.semProdutos}>Nenhum produto encontrado</Text>
            <Text style={styles.semProdutosSub}>Cadastre produtos ou verifique a conexão.</Text>
          </View>
        ) : (
          <View style={styles.listaProdutos}>
            {/* O .map agora está 100% seguro pois produtos é sempre um array */}
            {produtos.map((produto) => (
              <View key={produto.id} style={styles.produtoItem}>
                <View style={styles.produtoHeader}>
                  <Text style={styles.produtoNome}>{produto.nomeProduto}</Text>
                  <Text style={[
                    styles.produtoEstoque,
                    produto.estoque <= 5 && styles.estoqueAlerto,
                    produto.estoque <= 0 && styles.estoqueVazio
                  ]}>
                    {produto.estoque} un.
                  </Text>
                </View>
                {produto.preco > 0 && (
                  <Text style={styles.produtoPreco}>R$ {produto.preco.toFixed(2)}</Text>
                )}
                {produto.categoria && (
                  <Text style={styles.produtoCategoria}>{produto.categoria}</Text>
                )}

                <View style={styles.acoesProduto}>
                  <TouchableOpacity
                    style={[styles.botaoAcaoProduto, styles.botaoRemoverUnidade]}
                    onPress={() => removerUnidade(produto)}
                  >
                    <Text style={styles.textoBotaoAcaoProduto}>- 1 unidade</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.botaoAcaoProduto, styles.botaoExcluirProduto]}
                    onPress={() => excluirProduto(produto)}
                  >
                    <Text style={styles.textoBotaoAcaoProduto}>Excluir produto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.botao, carregando && styles.botaoCarregando]} 
          onPress={confirmarAtualizacao}
          disabled={carregando}
        >
          <Text style={styles.textoBotao}>
            {carregando ? '⏳ ATUALIZANDO...' : '🔄 ATUALIZAR ESTOQUE'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('/home')}>
          <Text style={styles.link}>Voltar ao Menu</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  content: { padding: 20, alignItems: 'center', paddingBottom: 30 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#d35400', marginBottom: 20 },
  semProdutosContainer: { width: '100%', backgroundColor: '#fff', padding: 30, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  semProdutos: { color: '#999', fontSize: 16, fontWeight: 'bold' },
  semProdutosSub: { color: '#ccc', fontSize: 12, marginTop: 8 },
  listaProdutos: { width: '100%', marginBottom: 20 },
  produtoItem: { width: '100%', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#d35400' },
  produtoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  produtoNome: { fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1 },
  produtoEstoque: { fontSize: 12, color: '#666', backgroundColor: '#f0f0f0', padding: 6, borderRadius: 4, marginLeft: 10 },
  produtoCategoria: { fontSize: 11, color: '#999', marginTop: 4 },
  estoqueAlerto: { backgroundColor: '#fff3cd', color: '#856404' },
  estoqueVazio: { backgroundColor: '#f8d7da', color: '#721c24', fontWeight: 'bold' },
  produtoPreco: { fontSize: 13, color: '#27ae60', fontWeight: '600', marginBottom: 5 },
  acoesProduto: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  botaoAcaoProduto: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' },
  botaoRemoverUnidade: { backgroundColor: '#f39c12' },
  botaoExcluirProduto: { backgroundColor: '#c0392b' },
  textoBotaoAcaoProduto: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  botao: { width: '100%', backgroundColor: '#27ae60', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, elevation: 3 },
  botaoCarregando: { backgroundColor: '#1e8449', opacity: 0.7 },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 15, color: '#333', textDecorationLine: 'underline', fontSize: 13 },
});