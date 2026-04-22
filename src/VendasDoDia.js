import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, RefreshControl } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './services/api';

export default function VendasDoDia() {
  const navigate = useNavigate();
  const [vendasHoje, setVendasHoje] = useState([]);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalDinheiro, setTotalDinheiro] = useState(0);
  const [totalCartao, setTotalCartao] = useState(0);
  const [totalPix, setTotalPix] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [dataAtual, setDataAtual] = useState('');

  const carregarVendasHoje = async () => {
    setCarregando(true);
    try {
      const response = await apiFetch('/vendas/dia');
      const dados = await response.json();

      console.log('Vendas do dia carregadas:', dados);

      if (dados.success && Array.isArray(dados.vendas)) {
        const vendasFormatadas = dados.vendas.map(v => ({
          id: v.id,
          data: v.data_venda,
          total: parseFloat(v.total) || 0,
          formaPagamento: v.forma_pagamento,
          itens: v.itens && v.itens !== '' ? v.itens.split(' | ').map(item => {
            const match = item.match(/(\d+)x (.+)/);
            if (match) {
              return {
                quantidade: parseInt(match[1]),
                nomeProduto: match[2]
              };
            }
            return { quantidade: 1, nomeProduto: item };
          }) : []
        }));

        setVendasHoje(vendasFormatadas);
        setDataAtual(new Date().toLocaleDateString('pt-BR'));

        const total = vendasFormatadas.reduce((acc, v) => acc + v.total, 0);
        setTotalVendas(total);

        const dinheiro = vendasFormatadas
          .filter(v => v.formaPagamento === 'dinheiro')
          .reduce((acc, v) => acc + v.total, 0);
        setTotalDinheiro(dinheiro);

        const cartao = vendasFormatadas
          .filter(v => v.formaPagamento === 'cartao')
          .reduce((acc, v) => acc + v.total, 0);
        setTotalCartao(cartao);

        const pix = vendasFormatadas
          .filter(v => v.formaPagamento === 'pix')
          .reduce((acc, v) => acc + v.total, 0);
        setTotalPix(pix);
      } else {
        setVendasHoje([]);
      }
    } catch (erro) {
      console.error('Erro ao carregar vendas:', erro);
      Alert.alert('Erro', 'Não foi possível carregar as vendas.');
      setVendasHoje([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarVendasHoje();
    
    // Registrar função global para atualizar vendas do dia
    window.atualizarVendasDoDia = carregarVendasHoje;
    
    return () => {
      delete window.atualizarVendasDoDia;
    };
  }, []);

  const formatarHora = (dataISO) => {
    if (!dataISO) return '--:--';
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getIconePagamento = (forma) => {
    const icones = {
      'dinheiro': '💵',
      'cartao': '💳',
      'pix': '📱'
    };
    return icones[forma] || '💰';
  };

  const getNomePagamento = (forma) => {
    const nomes = {
      'dinheiro': 'Dinheiro',
      'cartao': 'Cartão',
      'pix': 'Pix'
    };
    return nomes[forma] || forma || 'Outro';
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={carregando} onRefresh={carregarVendasHoje} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.titulo}>📊 Vendas do Dia</Text>
        <Text style={styles.subtitulo}>{dataAtual || new Date().toLocaleDateString('pt-BR')}</Text>

        <View style={styles.resumoContainer}>
          <View style={styles.cardResumo}>
            <Text style={styles.cardLabel}>Total Vendido</Text>
            <Text style={styles.cardValor}>R$ {totalVendas.toFixed(2)}</Text>
          </View>

          <View style={styles.cardResumo}>
            <Text style={styles.cardLabel}>Nº de Vendas</Text>
            <Text style={styles.cardValor}>{vendasHoje.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>💰 Por Forma de Pagamento</Text>
        <View style={styles.pagamentoResumo}>
          <View style={styles.pagamentoItem}>
            <Text style={styles.pagamentoLabel}>💵 Dinheiro</Text>
            <Text style={styles.pagamentoValor}>R$ {totalDinheiro.toFixed(2)}</Text>
          </View>
          <View style={styles.pagamentoItem}>
            <Text style={styles.pagamentoLabel}>💳 Cartão</Text>
            <Text style={styles.pagamentoValor}>R$ {totalCartao.toFixed(2)}</Text>
          </View>
          <View style={styles.pagamentoItem}>
            <Text style={styles.pagamentoLabel}>📱 Pix</Text>
            <Text style={styles.pagamentoValor}>R$ {totalPix.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📋 Vendas Realizadas</Text>
        
        {carregando && vendasHoje.length === 0 ? (
          <View style={styles.semVendas}>
            <Text>Carregando...</Text>
          </View>
        ) : vendasHoje.length === 0 ? (
          <View style={styles.semVendas}>
            <Text style={styles.semVendasTexto}>Nenhuma venda realizada hoje</Text>
          </View>
        ) : (
          vendasHoje.map((venda, index) => (
            <View key={venda.id || index} style={styles.vendaItem}>
              <View style={styles.vendaHeader}>
                <Text style={styles.vendaNumero}>Venda #{venda.id || (index + 1)}</Text>
                <Text style={styles.vendaHora}>{formatarHora(venda.data)}</Text>
              </View>
              
              <View style={styles.vendaItens}>
                {venda.itens.length > 0 ? (
                  venda.itens.map((item, i) => (
                    <Text key={i} style={styles.vendaItemTexto}>
                      {item.quantidade}x {item.nomeProduto}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.vendaItemTextoSemItens}>⚠️ Itens não registrados</Text>
                )}
              </View>

              <View style={styles.vendaFooter}>
                <Text style={styles.vendaPagamento}>
                  {getIconePagamento(venda.formaPagamento)} {getNomePagamento(venda.formaPagamento)}
                </Text>
                <Text style={styles.vendaTotal}>R$ {venda.total.toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity 
          style={styles.botaoAtualizar} 
          onPress={() => {
            carregarVendasHoje();
          }} 
          disabled={carregando}
        >
          <Text style={styles.textoBotaoAtualizar}>
            {carregando ? '⏳ ATUALIZANDO...' : '🔄 ATUALIZAR'}
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
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d35400',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  resumoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardResumo: {
    flex: 1,
    backgroundColor: '#d35400',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cardLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardValor: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 10,
    paddingLeft: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#d35400',
  },
  pagamentoResumo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  pagamentoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pagamentoLabel: {
    fontSize: 14,
    color: '#666',
  },
  pagamentoValor: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  semVendas: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  semVendasTexto: {
    fontSize: 14,
    color: '#999',
  },
  vendaItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  vendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  vendaNumero: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d35400',
  },
  vendaHora: {
    fontSize: 12,
    color: '#999',
  },
  vendaItens: {
    marginBottom: 10,
  },
  vendaItemTexto: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  vendaItemTextoSemItens: {
    fontSize: 12,
    color: '#e74c3c',
    fontStyle: 'italic',
  },
  vendaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  vendaPagamento: {
    fontSize: 13,
    color: '#666',
  },
  vendaTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d35400',
  },
  botaoAtualizar: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  textoBotaoAtualizar: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    marginTop: 15,
    color: '#333',
    textDecorationLine: 'underline',
    fontSize: 13,
    textAlign: 'center',
  },
});