import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useNavigate } from 'react-router-dom';

const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

export default function Home() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  const carregarUsuario = async () => {
    try {
      const salvo = await storage.getItem('usuarioLogado');
      if (salvo) {
        setUsuario(JSON.parse(salvo));
      } else {
        navigate('/', { replace: true });
      }
    } catch (e) {
      console.error('Erro ao carregar usuário:', e);
    }
  };

  useEffect(() => {
    carregarUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await storage.removeItem('usuarioLogado');
      navigate('/', { replace: true });
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.titulo}>Padaria Sistema</Text>
            <Text style={styles.boasVindas}>
              👋 Olá, {usuario?.nome || usuario?.email}!
            </Text>
            {usuario?.cargo && (
              <Text style={styles.cargo}>{usuario.cargo}</Text>
            )}
          </View>
          {/* Imagem do pão - CORRIGIDA */}
          <img 
            src="/assets/images/pao.png"
            style={{ width: 80, height: 80, objectFit: 'contain' }}
            alt="Pão"
          />
        </View>
      </View>

      {/* Menu Principal */}
      <View style={styles.menuContainer}>
        
        {/* --- CADASTROS --- */}
        <Text style={styles.sectionTitle}>📋 CADASTROS</Text>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigate('/gerenciar-funcionarios')}
        >
          <Text style={styles.itemIcon}>👥</Text>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>Funcionários</Text>
            <Text style={styles.itemDescription}>Gerenciar, editar e excluir</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigate('/cadastro-produtos')}
        >
          <Text style={styles.itemIcon}>📦</Text>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>Produtos</Text>
            <Text style={styles.itemDescription}>Cadastrar doces, salgados e diet</Text>
          </View>
        </TouchableOpacity>

        {/* --- VENDAS --- */}
        <Text style={styles.sectionTitle}>💰 VENDAS</Text>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigate('/vendas')}
        >
          <Text style={styles.itemIcon}>🛒</Text>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>Nova Venda</Text>
            <Text style={styles.itemDescription}>Registrar venda (PDV)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigate('/consultar-vendas')}
        >
          <Text style={styles.itemIcon}>📋</Text>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>Consultar Vendas</Text>
            <Text style={styles.itemDescription}>Histórico completo de vendas</Text>
          </View>
        </TouchableOpacity>

        {/* --- RELATÓRIOS --- */}
        <Text style={styles.sectionTitle}>📊 RELATÓRIOS</Text>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigate('/vendas-do-dia')}
        >
          <Text style={styles.itemIcon}>📈</Text>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>Vendas do Dia</Text>
            <Text style={styles.itemDescription}>Resumo e fechamento de hoje</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigate('/controle-estoque')}
        >
          <Text style={styles.itemIcon}>📉</Text>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>Controle de Estoque</Text>
            <Text style={styles.itemDescription}>Ajustar quantidades</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Botão Logout */}
      <TouchableOpacity style={styles.botaoLogout} onPress={handleLogout}>
        <Text style={styles.textoLogout}>🚪 Sair do Sistema</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sistema de Gerenciamento - Padaria</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    minHeight: '100vh',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#d35400',
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d35400',
    marginBottom: 5,
  },
  boasVindas: {
    fontSize: 16,
    color: '#666',
  },
  cargo: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '600',
    marginTop: 3,
  },
  menuContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
    paddingLeft: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#d35400',
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 12,
    color: '#999',
  },
  botaoLogout: {
    margin: 20,
    padding: 15,
    backgroundColor: '#c0392b',
    borderRadius: 8,
    alignItems: 'center',
  },
  textoLogout: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
});