import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Alert } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './services/api';

export default function ConsultarVendas() {
  const navigate = useNavigate();
  const [todasVendas, setTodasVendas] = useState([]);
  const [vendasFiltradas, setVendasFiltradas] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarVendas();
    
    // Registrar função global
    window.atualizarConsultarVendas = carregarVendas;
    
    return () => {
      delete window.atualizarConsultarVendas;
    };
  }, []);

  const carregarVendas = async () => {
    setCarregando(true);
    try {
      // Usar a rota correta para consultar todas as vendas
      const response = await apiFetch('/vendas/consultar');
      const dados = await response.json();
      
      console.log('Dados recebidos:', dados);
      
      if (dados.success && dados.vendas) {
        console.log('Vendas encontradas:', dados.vendas.length);
        
        const vendas = dados.vendas.map(v => ({
          id: (v.id || v.id_venda || v.venda_id).toString(),
          data: v.data_venda,
          total: parseFloat(v.total_venda || v.total || 0),
          formaPagamento: v.forma_pagamento,
          itens: v.itens && v.itens !== '' ? v.itens.split(' | ').map(item => {
            const match = item.match(/(\d+)x (.+)/);
            const quantidade = match ? parseInt(match[1]) : 1;
            const nomeProduto = match ? match[2] : item;
            return {
              quantidade: quantidade,
              nomeProduto: nomeProduto,
              subtotal: 0
            };
          }) : []
        })).sort((a, b) => new Date(b.data) - new Date(a.data));
        
        setTodasVendas(vendas);
      } else {
        console.log('Nenhuma venda encontrada ou formato inválido');
        setTodasVendas([]);
      }
    } catch (erro) {
      console.error('Erro ao carregar vendas:', erro);
      Alert.alert('Erro', 'Não foi possível carregar as vendas.');
      setTodasVendas([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todasVendas, filtroPeriodo, busca]);

  const aplicarFiltros = () => {
    let filtradas = [...todasVendas];
    const agora = new Date();
    agora.setHours(0, 0, 0, 0);

    // Filtro de Período
    if (filtroPeriodo === 'hoje') {
      const hojeStr = agora.toISOString().split('T')[0];
      filtradas = filtradas.filter(v => {
        const dataVenda = new Date(v.data);
        dataVenda.setHours(0, 0, 0, 0);
        return dataVenda.toISOString().split('T')[0] === hojeStr;
      });
    } else if (filtroPeriodo === 'semana') {
      const umaSemanaAtras = new Date(agora);
      umaSemanaAtras.setDate(agora.getDate() - 7);
      filtradas = filtradas.filter(v => {
        const dataVenda = new Date(v.data);
        dataVenda.setHours(0, 0, 0, 0);
        return dataVenda >= umaSemanaAtras;
      });
    } else if (filtroPeriodo === 'mes') {
      const umMesAtras = new Date(agora);
      umMesAtras.setDate(agora.getDate() - 30);
      filtradas = filtradas.filter(v => {
        const dataVenda = new Date(v.data);
        dataVenda.setHours(0, 0, 0, 0);
        return dataVenda >= umMesAtras;
      });
    }

    // Filtro de Busca
    if (busca.trim() !== '') {
      const termo = busca.toLowerCase();
      filtradas = filtradas.filter(v => {
        const temProduto = v.itens.some(item => item.nomeProduto.toLowerCase().includes(termo));
        const ehId = v.id.includes(termo);
        return temProduto || ehId;
      });
    }

    setVendasFiltradas(filtradas);
  };

  const abrirDetalhes = (venda) => {
    setVendaSelecionada(venda);
    setModalVisible(true);
  };

  const formatarData = (dataISO) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getCorStatus = (formaPagamento) => {
    if (formaPagamento === 'dinheiro') return '#27ae60';
    if (formaPagamento === 'cartao') return '#f39c12';
    if (formaPagamento === 'pix') return '#8e44ad';
    return '#333';
  };

  const getIconePagamento = (formaPagamento) => {
    if (formaPagamento === 'dinheiro') return '💵';
    if (formaPagamento === 'cartao') return '💳';
    if (formaPagamento === 'pix') return '📱';
    return '💰';
  };

  const calcularTotal = () => {
    return vendasFiltradas.reduce((acc, v) => acc + (v.total || 0), 0);
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.titulo}>📋 Consultar Vendas</Text>
      </View>

      {/* Filtros de Período (Scroll Horizontal) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll}>
        <TouchableOpacity 
          style={[styles.filtroChip, filtroPeriodo === 'todos' && styles.filtroAtivo]} 
          onPress={() => setFiltroPeriodo('todos')}
        >
          <Text style={[styles.filtroTexto, filtroPeriodo === 'todos' && styles.filtroTextoAtivo]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filtroChip, filtroPeriodo === 'hoje' && styles.filtroAtivo]} 
          onPress={() => setFiltroPeriodo('hoje')}
        >
          <Text style={[styles.filtroTexto, filtroPeriodo === 'hoje' && styles.filtroTextoAtivo]}>Hoje</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filtroChip, filtroPeriodo === 'semana' && styles.filtroAtivo]} 
          onPress={() => setFiltroPeriodo('semana')}
        >
          <Text style={[styles.filtroTexto, filtroPeriodo === 'semana' && styles.filtroTextoAtivo]}>7 Dias</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filtroChip, filtroPeriodo === 'mes' && styles.filtroAtivo]} 
          onPress={() => setFiltroPeriodo('mes')}
        >
          <Text style={[styles.filtroTexto, filtroPeriodo === 'mes' && styles.filtroTextoAtivo]}>30 Dias</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Barra de Busca */}
      <TextInput
        style={styles.inputBusca}
        placeholder="Buscar por produto ou ID..."
        value={busca}
        onChangeText={setBusca}
        placeholderTextColor="#999"
      />

      {/* Resumo Rápido */}
      <View style={styles.resumoRapido}>
        <View>
          <Text style={styles.resumoLabel}>Total Encontrado</Text>
          <Text style={styles.resumoValor}>{vendasFiltradas.length} venda(s)</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.resumoLabel}>Valor Total</Text>
          <Text style={styles.resumoValorTotal}>R$ {calcularTotal().toFixed(2)}</Text>
        </View>
      </View>

      {/* Botão Atualizar */}
      <TouchableOpacity 
        style={[styles.botaoAtualizar, carregando && styles.botaoCarregando]} 
        onPress={carregarVendas}
        disabled={carregando}
      >
        <Text style={styles.textoBotaoAtualizar}>
          {carregando ? '⏳ ATUALIZANDO...' : '🔄 ATUALIZAR VENDAS'}
        </Text>
      </TouchableOpacity>

      {/* Lista de Vendas */}
      <ScrollView style={styles.lista}>
        {carregando && vendasFiltradas.length === 0 ? (
          <View style={styles.semDados}>
            <Text style={styles.semDadosTexto}>Carregando vendas...</Text>
          </View>
        ) : vendasFiltradas.length === 0 ? (
          <View style={styles.semDados}>
            <Text style={styles.semDadosEmoji}>🔍</Text>
            <Text style={styles.semDadosTexto}>Nenhuma venda encontrada para o período selecionado.</Text>
          </View>
        ) : (
          vendasFiltradas.map((venda) => (
            <TouchableOpacity key={venda.id} style={styles.card} onPress={() => abrirDetalhes(venda)} activeOpacity={0.7}>
              <View style={styles.cardTopo}>
                <View>
                  <Text style={styles.cardId}>Venda #{venda.id.slice(-6)}</Text>
                  <Text style={styles.cardData}>{formatarData(venda.data)}</Text>
                </View>
                <View style={[styles.badgePagamento, { backgroundColor: getCorStatus(venda.formaPagamento) + '15' }]}>
                  <Text style={[styles.badgeTexto, { color: getCorStatus(venda.formaPagamento) }]}>
                    {getIconePagamento(venda.formaPagamento)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardItensResumo}>
                <Text style={styles.cardItensTexto} numberOfLines={2}>
                  {venda.itens.length > 0 
                    ? venda.itens.map(i => `${i.quantidade}x ${i.nomeProduto}`).join(', ')
                    : '⚠️ Itens não registrados'}
                </Text>
              </View>

              <View style={styles.cardRodape}>
                <Text style={styles.cardTotalLabel}>Total</Text>
                <Text style={styles.cardTotalValor}>R$ {venda.total.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigate('/home')}>
        <Text style={styles.textoBotaoVoltar}>Voltar ao Menu</Text>
      </TouchableOpacity>

      {/* MODAL DE DETALHES */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Detalhes da Venda</Text>
            
            {vendaSelecionada && (
              <>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>ID</Text>
                    <Text style={styles.infoValor}>#{vendaSelecionada.id.slice(-8)}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Pagamento</Text>
                    <Text style={[styles.infoValor, { color: getCorStatus(vendaSelecionada.formaPagamento) }]}>
                      {getIconePagamento(vendaSelecionada.formaPagamento)} {vendaSelecionada.formaPagamento?.toUpperCase() || 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.infoLabelFull}>Data/Hora: {formatarData(vendaSelecionada.data)}</Text>
                
                <Text style={styles.subTitulo}>Itens Comprados:</Text>
                <View style={styles.listaItensModal}>
                  {vendaSelecionada.itens.length > 0 ? (
                    vendaSelecionada.itens.map((item, index) => (
                      <View key={index} style={styles.itemLinhaModal}>
                        <Text style={styles.itemNomeModal}>{item.quantidade}x {item.nomeProduto}</Text>
                        <Text style={styles.itemValorModal}>
                          R$ {(item.quantidade * (vendaSelecionada.total / vendaSelecionada.itens.reduce((acc, i) => acc + i.quantidade, 1))).toFixed(2)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.semItensModal}>Nenhum item registrado para esta venda</Text>
                  )}
                </View>

                <View style={styles.divider} />
                
                <View style={styles.detalheLinhaTotal}>
                  <Text style={styles.detalheLabelTotal}>TOTAL FINAL:</Text>
                  <Text style={styles.detalheValorTotal}>R$ {vendaSelecionada.total.toFixed(2)}</Text>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.botaoFecharModal} onPress={() => setModalVisible(false)}>
              <Text style={styles.textoBotaoModal}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 20 },
  header: { marginBottom: 15, marginTop: 10 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#d35400' },
  
  // Filtros
  filtrosScroll: { marginBottom: 15, maxHeight: 50 },
  filtroChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginRight: 10 },
  filtroAtivo: { backgroundColor: '#d35400', borderColor: '#d35400' },
  filtroTexto: { fontSize: 13, color: '#666', fontWeight: '500' },
  filtroTextoAtivo: { color: '#fff', fontWeight: 'bold' },

  inputBusca: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', fontSize: 14 },
  
  resumoRapido: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#27ae60', elevation: 1 },
  resumoLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  resumoValor: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  resumoValorTotal: { fontSize: 18, fontWeight: 'bold', color: '#27ae60' },

  botaoAtualizar: {
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  botaoCarregando: {
    backgroundColor: '#1e8449',
    opacity: 0.7,
  },
  textoBotaoAtualizar: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  lista: { flex: 1 },
  semDados: { alignItems: 'center', marginTop: 60 },
  semDadosEmoji: { fontSize: 40, marginBottom: 10 },
  semDadosTexto: { color: '#999', fontSize: 16 },

  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardId: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  cardData: { fontSize: 12, color: '#999', marginTop: 2 },
  badgePagamento: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  badgeTexto: { fontSize: 14, fontWeight: 'bold' },
  
  cardItensResumo: { marginBottom: 10 },
  cardItensTexto: { fontSize: 13, color: '#555', lineHeight: 18 },
  
  cardRodape: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  cardTotalLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  cardTotalValor: { fontSize: 16, fontWeight: 'bold', color: '#d35400' },

  botaoVoltar: { marginTop: 20, padding: 15, alignItems: 'center', marginBottom: 20 },
  textoBotaoVoltar: { color: '#333', textDecorationLine: 'underline', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '90%', maxHeight: '85%', padding: 25, borderRadius: 15 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#d35400' },
  
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  infoValor: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  infoLabelFull: { fontSize: 13, color: '#666', marginBottom: 15, textAlign: 'center' },

  subTitulo: { fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 10 },
  
  listaItensModal: { maxHeight: 200 },
  itemLinhaModal: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  itemNomeModal: { fontSize: 14, color: '#555', flex: 1 },
  itemValorModal: { fontSize: 14, fontWeight: '600', color: '#333' },
  semItensModal: { textAlign: 'center', color: '#999', padding: 20 },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  
  detalheLinhaTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detalheLabelTotal: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  detalheValorTotal: { fontSize: 20, fontWeight: 'bold', color: '#d35400' },

  botaoFecharModal: { backgroundColor: '#333', padding: 14, borderRadius: 8, marginTop: 25, alignItems: 'center' },
  textoBotaoModal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});