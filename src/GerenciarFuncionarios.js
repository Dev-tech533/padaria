import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Alert } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './services/api';

export default function GerenciarFuncionarios() {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Estado para formulário (Novo ou Edição)
  const [editandoId, setEditandoId] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    setCarregando(true);
    try {
      const response = await apiFetch('/funcionarios');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível carregar os funcionários.');
      }

      setFuncionarios(Array.isArray(data.funcionarios) ? data.funcionarios : []);
    } catch (erro) {
      console.error('Erro ao carregar funcionários:', erro);
      Alert.alert('Erro', erro.message || 'Não foi possível carregar os funcionários.');
    } finally {
      setCarregando(false);
    }
  };

  const limparFormulario = () => {
    setEditandoId(null);
    setNome('');
    setEmail('');
    setSenha('');
    setCargo('');
    setTelefone('');
  };

  const abrirNovo = () => {
    limparFormulario();
    setModalVisible(true);
  };

  const abrirEdicao = (func) => {
    setEditandoId(func.id);
    setNome(func.nome || '');
    setEmail(func.email || '');
    setSenha('');
    setCargo(func.cargo || '');
    setTelefone(func.telefone || '');
    setModalVisible(true);
  };

  const salvarFuncionario = async () => {
    if (!nome || !email) {
      Alert.alert('Atenção', 'Nome e E-mail são obrigatórios.');
      return;
    }

    if (!editandoId && !senha) {
      Alert.alert('Atenção', 'Senha é obrigatória para novos usuários.');
      return;
    }

    try {
      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        cargo: cargo.trim(),
        telefone: telefone.trim(),
      };

      if (senha.trim()) {
        payload.senha = senha.trim();
      }

      const response = await apiFetch(editandoId ? `/funcionarios/${editandoId}` : '/funcionarios', {
        method: editandoId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível salvar o funcionário.');
      }

      Alert.alert('Sucesso', editandoId ? 'Funcionário atualizado!' : 'Funcionário cadastrado!');
      setModalVisible(false);
      limparFormulario();
      carregarFuncionarios();
    } catch (erro) {
      console.error('Erro ao salvar funcionário:', erro);
      Alert.alert('Erro', erro.message || 'Não foi possível salvar.');
    }
  };

  const excluirFuncionario = (id) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este funcionário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiFetch(`/funcionarios/${id}`, {
                method: 'DELETE',
              });

              const data = await response.json();
              if (!response.ok || !data.success) {
                throw new Error(data.error || 'Não foi possível excluir o funcionário.');
              }

              Alert.alert('Excluído', 'Funcionário removido.');
              carregarFuncionarios();
            } catch (erro) {
              console.error('Erro ao excluir funcionário:', erro);
              Alert.alert('Erro', erro.message || 'Não foi possível excluir o funcionário.');
            }
          }
        }
      ]
    );
  };

  // Filtrar lista
  const listaFiltrada = funcionarios.filter(f =>
    (f.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (f.email || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.titulo}>👥 Gerenciar Funcionários</Text>
        <TouchableOpacity style={styles.botaoNovo} onPress={abrirNovo}>
          <Text style={styles.textoBotaoNovo}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <TextInput
        style={styles.inputBusca}
        placeholder="Buscar por nome ou e-mail..."
        value={busca}
        onChangeText={setBusca}
      />

      {/* Lista */}
      <ScrollView style={styles.lista}>
        {carregando ? (
          <Text style={styles.semDados}>Carregando funcionários...</Text>
        ) : listaFiltrada.length === 0 ? (
          <Text style={styles.semDados}>Nenhum funcionário encontrado.</Text>
        ) : (
          listaFiltrada.map((func) => (
            <View key={func.id} style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{func.nome}</Text>
                <Text style={styles.cardCargo}>{func.cargo || 'Sem cargo'}</Text>
                <Text style={styles.cardEmail}>{func.email}</Text>
              </View>
              <View style={styles.cardAcoes}>
                <TouchableOpacity
                  style={styles.botaoEditar}
                  onPress={() => abrirEdicao(func)}
                >
                  <Text style={styles.textoBotaoAcao}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => excluirFuncionario(func.id)}
                >
                  <Text style={styles.textoBotaoAcao}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigate('/home')}>
        <Text style={styles.textoBotaoVoltar}>Voltar ao Menu</Text>
      </TouchableOpacity>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>
              {editandoId ? 'Editar Funcionário' : 'Novo Funcionário'}
            </Text>

            <TextInput style={styles.input} placeholder="Nome Completo" value={nome} onChangeText={setNome} />
            <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder={editandoId ? 'Senha (preencha só se quiser trocar)' : 'Senha'} value={senha} onChangeText={setSenha} secureTextEntry />
            <TextInput style={styles.input} placeholder="Cargo" value={cargo} onChangeText={setCargo} />
            <TextInput style={styles.input} placeholder="Telefone" value={telefone} onChangeText={setTelefone} />

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => { setModalVisible(false); limparFormulario(); }}>
                <Text style={styles.textoBotaoModal}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSalvar} onPress={salvarFuncionario}>
                <Text style={styles.textoBotaoModal}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#d35400' },
  botaoNovo: { backgroundColor: '#27ae60', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  textoBotaoNovo: { color: '#fff', fontWeight: 'bold' },
  inputBusca: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  lista: { flex: 1 },
  semDados: { textAlign: 'center', color: '#999', marginTop: 30 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardCargo: { fontSize: 13, color: '#d35400', marginBottom: 2 },
  cardEmail: { fontSize: 12, color: '#666' },
  cardAcoes: { flexDirection: 'row', gap: 10 },
  botaoEditar: { padding: 8, backgroundColor: '#f39c12', borderRadius: 5, marginLeft: 5 },
  botaoExcluir: { padding: 8, backgroundColor: '#c0392b', borderRadius: 5, marginLeft: 5 },
  textoBotaoAcao: { fontSize: 16 },
  botaoVoltar: { marginTop: 20, padding: 15, alignItems: 'center' },
  textoBotaoVoltar: { color: '#333', textDecorationLine: 'underline' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '90%', padding: 20, borderRadius: 10 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#d35400' },
  input: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  modalBotoes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  botaoCancelar: { flex: 1, backgroundColor: '#95a5a6', padding: 12, borderRadius: 6, marginRight: 5, alignItems: 'center' },
  botaoSalvar: { flex: 1, backgroundColor: '#27ae60', padding: 12, borderRadius: 6, marginLeft: 5, alignItems: 'center' },
  textoBotaoModal: { color: '#fff', fontWeight: 'bold' },
});
